import os
import json
import hmac
import hashlib
from django.db import connection, transaction
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

import stripe

from .models import (
    Service, DonationCampaign, Donation, Giving, Payment, PaymentWebhook
)
from .serializers import (
    ServiceSerializer, DonationCampaignSerializer, DonationSerializer,
    GivingSerializer, PaymentSerializer
)
from users.permissions import IsAdminUser, IsMinisterUser, IsAdminOrMinisterUser, HasPermission


class RoleBasedAccessMixin:
    """Enforce granular role-based permissions per action.

    - SAFE methods: any authenticated user
    - create/update/partial_update: admin OR role permission (perm_code)
    - destroy: admin only
    """

    perm_code: str | None = None

    def _has_write_access(self, request) -> bool:
        # Admins always allowed
        if IsAdminUser().has_permission(request, self):
            return True
        # Ministers with explicit permission code
        if self.perm_code and HasPermission(self.perm_code).has_permission(request, self):
            return True
        return False

    def perform_create(self, serializer):  # default: check write access
        request = self.request
        if not self._has_write_access(request):
            raise PermissionDenied("You do not have permission to create this resource.")
        serializer.save()

    def perform_update(self, serializer):  # default: check write access
        request = self.request
        if not self._has_write_access(request):
            raise PermissionDenied("You do not have permission to modify this resource.")
        serializer.save()

    def get_permissions(self):
        if getattr(self, 'action', None) in ["list", "retrieve"]:
            return [IsAuthenticated()]
        if getattr(self, 'action', None) in ["create", "update", "partial_update", "destroy"]:
            # We still require authentication; write-access is enforced in perform_* methods
            return [IsAuthenticated()]
        return super().get_permissions()


# Configure Stripe
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
if STRIPE_API_KEY:
    stripe.api_key = STRIPE_API_KEY


class ServiceViewSet(RoleBasedAccessMixin, viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('-created_at')
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    perm_code = 'services_manage'


class DonationCampaignViewSet(RoleBasedAccessMixin, viewsets.ModelViewSet):
    queryset = DonationCampaign.objects.all().order_by('-created_at')
    serializer_class = DonationCampaignSerializer
    permission_classes = [IsAuthenticated]
    perm_code = 'donations_manage'


class DonationViewSet(RoleBasedAccessMixin, viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-created_at')
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]
    perm_code = 'donations_manage'


class GivingViewSet(RoleBasedAccessMixin, viewsets.ModelViewSet):
    queryset = Giving.objects.all().order_by('-created_at')
    serializer_class = GivingSerializer
    permission_classes = [IsAuthenticated]
    perm_code = 'giving_manage'

    def perform_create(self, serializer):
        """Attendees can only create giving for themselves. Admin/authorized ministers may specify user.
        """
        request = self.request
        if self._has_write_access(request):
            # Admin or minister with permission may create for any user
            serializer.save()
        else:
            # Force to self and ignore/override incoming user
            serializer.save(user=request.user)

    def perform_update(self, serializer):
        request = self.request
        instance: Giving = self.get_object()
        if self._has_write_access(request):
            serializer.save()
        else:
            # Attendee can only update their own giving; cannot reassign user
            if instance.user_id != request.user.id:
                raise PermissionDenied("You can only modify your own giving records.")
            # Ensure user remains self
            serializer.save(user=request.user)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'stripe_webhook'

    @transaction.atomic
    def post(self, request):
        if not STRIPE_WEBHOOK_SECRET:
            return Response({"error": "Webhook secret not configured"}, status=500)

        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=sig_header,
                secret=STRIPE_WEBHOOK_SECRET,
            )
        except ValueError:
            return Response({"error": "Invalid payload"}, status=400)
        except stripe.error.SignatureVerificationError:
            # Save webhook attempt even if invalid signature
            PaymentWebhook.objects.create(
                provider='stripe',
                event_id=None,
                event_type=None,
                signature_valid=False,
                payment=None,
                raw_payload=json.loads(payload.decode('utf-8') or '{}'),
            )
            return Response({"error": "Invalid signature"}, status=400)

        data = event.get('data', {}).get('object', {})
        event_type = event.get('type')
        event_id = event.get('id')

        # Basic mapping: expects you to include our internal reference in metadata
        internal_kind = None
        internal_id = None
        metadata = data.get('metadata') or {}
        if 'giving_id' in metadata:
            internal_kind = 'giving'
            internal_id = metadata.get('giving_id')
        elif 'donation_id' in metadata:
            internal_kind = 'donation'
            internal_id = metadata.get('donation_id')

        amount = None
        currency = None
        external_id = None
        status_str = None

        # Handle common event types (checkout.session.completed, payment_intent.succeeded, etc.)
        if event_type.startswith('payment_intent.'):
            pi = data
            amount = (pi.get('amount_received') or pi.get('amount'))
            if amount is not None:
                amount = amount / 100.0
            currency = pi.get('currency', 'usd').upper()
            external_id = pi.get('id')
            status_str = pi.get('status') or 'succeeded'
        elif event_type.startswith('checkout.session.'):
            cs = data
            amount_total = cs.get('amount_total')
            if amount_total is not None:
                amount = amount_total / 100.0
            currency = cs.get('currency', 'usd').upper()
            external_id = cs.get('payment_intent') or cs.get('id')
            status_str = cs.get('payment_status') or 'succeeded'
        else:
            # store webhook and return OK
            PaymentWebhook.objects.create(
                provider='stripe',
                event_id=event_id,
                event_type=event_type,
                signature_valid=True,
                payment=None,
                raw_payload=event,
            )
            return Response({"received": True})

        # Upsert Payment
        payment, _ = Payment.objects.get_or_create(
            external_id=external_id,
            defaults={
                'provider': 'stripe',
                'status': status_str or 'succeeded',
                'currency': currency or 'USD',
                'amount': amount or 0,
            }
        )
        # Attach link to giving/donation if provided
        if internal_kind == 'giving':
            try:
                payment.giving_id = internal_id
            except Exception:
                pass
        elif internal_kind == 'donation':
            try:
                payment.donation_id = internal_id
            except Exception:
                pass
        # Update fields
        if amount is not None:
            payment.amount = amount
        if currency:
            payment.currency = currency
        if status_str:
            payment.status = status_str
        payment.provider = 'stripe'
        payment.save()

        # Save webhook
        PaymentWebhook.objects.create(
            provider='stripe',
            event_id=event_id,
            event_type=event_type,
            signature_valid=True,
            payment=payment,
            raw_payload=event,
        )

        return Response({"status": "ok"})


class PesapalWebhookView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'pesapal_webhook'

    @transaction.atomic
    def post(self, request):
        # HMAC validation: compute HMAC-SHA256 over raw body using PESAPAL_WEBHOOK_SECRET
        secret = (os.getenv("PESAPAL_WEBHOOK_SECRET") or '').encode('utf-8')
        provided = request.headers.get("X-Pesapal-Signature-Hmac") or request.headers.get("X-Pesapal-Signature")
        raw = request.body or b''
        valid_sig = False
        if secret and provided:
            digest = hmac.new(secret, raw, hashlib.sha256).hexdigest()
            valid_sig = hmac.compare_digest(digest, provided)
        if not valid_sig:
            PaymentWebhook.objects.create(
                provider='pesapal', signature_valid=False, raw_payload=json.loads((raw or b'{}').decode('utf-8'))
            )
            return Response({"error": "Invalid signature"}, status=400)

        payload = json.loads((request.body or b'{}').decode('utf-8'))
        ext_id = payload.get('transaction_tracking_id') or payload.get('order_tracking_id')
        amount = payload.get('amount')
        try:
            amount = float(amount) if amount is not None else None
        except Exception:
            amount = None
        currency = (payload.get('currency') or 'USD').upper()
        status_str = payload.get('status') or 'pending'
        reference = payload.get('reference')  # our internal reference if we set it

        payment, _ = Payment.objects.get_or_create(
            external_id=ext_id,
            defaults={
                'provider': 'pesapal',
                'status': status_str,
                'currency': currency,
                'amount': amount or 0,
                'external_reference': reference,
            }
        )
        if amount is not None:
            payment.amount = amount
        payment.status = status_str
        payment.currency = currency
        if reference:
            payment.external_reference = reference
        payment.provider = 'pesapal'
        payment.save()

        PaymentWebhook.objects.create(
            provider='pesapal', signature_valid=True, payment=payment, raw_payload=payload
        )
        return Response({"status": "ok"})


class MobileMoneyWebhookView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'mobile_money_webhook'

    @transaction.atomic
    def post(self, request):
        # Generic HMAC validation for Mobile Money providers
        secret = (os.getenv("MOBILE_MONEY_WEBHOOK_SECRET") or '').encode('utf-8')
        provided = request.headers.get("X-MobileMoney-Signature-Hmac") or request.headers.get("X-MobileMoney-Signature")
        raw = request.body or b''
        valid_sig = False
        if secret and provided:
            digest = hmac.new(secret, raw, hashlib.sha256).hexdigest()
            valid_sig = hmac.compare_digest(digest, provided)
        if not valid_sig:
            PaymentWebhook.objects.create(
                provider='mobile_money', signature_valid=False, raw_payload=json.loads((raw or b'{}').decode('utf-8'))
            )
            return Response({"error": "Invalid signature"}, status=400)

        payload = json.loads((request.body or b'{}').decode('utf-8'))
        ext_id = payload.get('transaction_id') or payload.get('reference_id')
        amount = payload.get('amount')
        try:
            amount = float(amount) if amount is not None else None
        except Exception:
            amount = None
        currency = (payload.get('currency') or 'USD').upper()
        status_str = payload.get('status') or 'pending'
        internal_ref = (payload.get('metadata') or {}).get('giving_id') or (payload.get('metadata') or {}).get('donation_id')

        payment, _ = Payment.objects.get_or_create(
            external_id=ext_id,
            defaults={
                'provider': 'mobile_money',
                'status': status_str,
                'currency': currency,
                'amount': amount or 0,
                'external_reference': internal_ref,
            }
        )
        if amount is not None:
            payment.amount = amount
        payment.status = status_str
        payment.currency = currency
        if internal_ref:
            payment.external_reference = internal_ref
        payment.provider = 'mobile_money'
        payment.save()

        PaymentWebhook.objects.create(
            provider='mobile_money', signature_valid=True, payment=payment, raw_payload=payload
        )
        return Response({"status": "ok"})


class SQLViewBase(APIView):
    permission_classes = [IsAuthenticated]
    view_name = None

    def get(self, request):
        if not self.view_name:
            return Response([], status=200)
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM {self.view_name}")
            cols = [c[0] for c in cursor.description]
            rows = [dict(zip(cols, r)) for r in cursor.fetchall()]
        return Response(rows)


class GivingSummaryWeeklyView(SQLViewBase):
    view_name = 'v_giving_summary_weekly'


class GivingSummaryMonthlyView(SQLViewBase):
    view_name = 'v_giving_summary_monthly'


class DonationsSummaryWeeklyView(SQLViewBase):
    view_name = 'v_donations_summary_weekly'


class DonationsSummaryMonthlyView(SQLViewBase):
    view_name = 'v_donations_summary_monthly'


class RefreshReportingMaterializedViews(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT refresh_reporting_materialized_views();")
        return Response({"refreshed": True})
