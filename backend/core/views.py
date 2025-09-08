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
from django.core.cache import cache

import stripe

from .models import (
    Service, DonationCampaign, Donation, Giving, Payment, PaymentWebhook,
    EngagementLog, NewsletterSubscriber
)
from .services.validators import is_valid_email, is_valid_name, is_human_text
from .serializers import (
    ServiceSerializer, DonationCampaignSerializer, DonationSerializer,
    GivingSerializer, PaymentSerializer
)
from users.permissions import IsAdminUser, IsMinisterUser, IsAdminOrMinisterUser, HasPermission
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse
import csv


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

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status__in=[s.strip() for s in status_param.split(',') if s.strip()])
        return qs

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def upsert_simple(self, request):
        """Create a pending donation record for the current user (or specified if admin/min).

        Body: { amount: number, donation_type: 'partner'|'project'|'mission', campaign_id?: uuid }
        Returns: { id, status }
        """
        data = request.data or {}
        amount = data.get('amount')
        donation_type = (data.get('donation_type') or '').lower()
        campaign_id = data.get('campaign_id')
        if amount is None:
            return Response({"error": "amount is required"}, status=400)
        try:
            amount = float(amount)
        except Exception:
            return Response({"error": "amount must be a number"}, status=400)
        if amount <= 0:
            return Response({"error": "amount must be > 0"}, status=400)
        if donation_type not in {"partner", "project", "mission"}:
            return Response({"error": "donation_type must be partner|project|mission"}, status=400)

        # Create a new pending record
        if IsAdminUser().has_permission(request, self) or self._has_write_access(request):
            user = data.get('user') or request.user
        else:
            user = request.user

        donation = Donation.objects.create(
            user=user,
            campaign_id=campaign_id,
            amount=amount,
            donation_type=donation_type,
            status='pending',
        )
        return Response({"id": str(donation.id), "status": donation.status}, status=201)


class GivingViewSet(RoleBasedAccessMixin, viewsets.ModelViewSet):
    queryset = Giving.objects.all().order_by('-created_at')
    serializer_class = GivingSerializer
    permission_classes = [IsAuthenticated]
    perm_code = 'giving_manage'

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status__in=[s.strip() for s in status_param.split(',') if s.strip()])
        return qs

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

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def upsert_simple(self, request):
        """Create a pending giving record for the current user (or specified if admin/min).

        Body: { amount: number, giving_type: 'tithe'|'offering', service_id?: uuid, method?: 'card'|'mobile_money' }
        Returns: { id, status }
        """
        data = request.data or {}
        amount = data.get('amount')
        giving_type = (data.get('giving_type') or '').lower()
        service_id = data.get('service_id')
        method = data.get('method')
        if amount is None:
            return Response({"error": "amount is required"}, status=400)
        try:
            amount = float(amount)
        except Exception:
            return Response({"error": "amount must be a number"}, status=400)
        if amount <= 0:
            return Response({"error": "amount must be > 0"}, status=400)
        if giving_type not in {"tithe", "offering"}:
            return Response({"error": "giving_type must be tithe|offering"}, status=400)

        if IsAdminUser().has_permission(request, self) or self._has_write_access(request):
            user = data.get('user') or request.user
        else:
            user = request.user

        giving = Giving.objects.create(
            user=user,
            service_id=service_id,
            amount=amount,
            giving_type=giving_type,
            method=method,
            status='pending',
        )
        return Response({"id": str(giving.id), "status": giving.status}, status=201)


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


class PaymentsPrepareView(APIView):
    """Prepare a local record for a payment before redirecting to a provider.

    Accepts either a Give payload or a Donation payload and creates a pending row
    in the respective table, returning its id so payment metadata can reference it.

    Body example (Give):
      { "mode": "give", "amount": 100, "type": "offering", "currency": "USD", "method": "card", "service_id": null }

    Body example (Donate):
      { "mode": "donate", "amount": 50, "type": "project", "currency": "USD", "campaign_id": null }
    """

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data or {}
        # Simple IP-based rate limit: 15 requests per 60 seconds
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR') or 'unknown'
        key = f"prep_rate:{ip}"
        count = cache.get(key, 0)
        if count and int(count) >= 15:
            return Response({"error": "Too many requests, please try again shortly."}, status=429)
        cache.set(key, int(count) + 1, timeout=60)

        mode = (data.get('mode') or '').lower()
        amount = data.get('amount')
        currency = (data.get('currency') or 'USD').upper()
        method = (data.get('method') or '').lower()  # card|mobile_money
        type_val = (data.get('type') or '').lower()
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()
        message = (data.get('message') or '').strip()
        if amount is None:
            return Response({"error": "amount is required"}, status=400)
        try:
            amount = float(amount)
        except Exception:
            return Response({"error": "amount must be a number"}, status=400)
        if amount <= 0:
            return Response({"error": "amount must be > 0"}, status=400)

        # Human validation
        if not is_valid_name(name):
            return Response({"error": "Please provide your real name."}, status=400)
        if not is_valid_email(email):
            return Response({"error": "Please provide a valid email address."}, status=400)
        if not is_human_text(message, optional=True):
            return Response({"error": "Message appears invalid. Avoid links/scripts and add a few words."}, status=400)

        # Allow anonymous create; if authenticated, attach to user
        user = request.user if request.user and request.user.is_authenticated else None

        if mode == 'give':
            if type_val not in {'tithe', 'offering'}:
                return Response({"error": "type must be tithe|offering for give"}, status=400)
            service_id = data.get('service_id')
            giving = Giving.objects.create(
                user=user,
                service_id=service_id,
                amount=amount,
                giving_type=type_val,
                method=method or None,
                status='pending',
            )
            return Response({
                "kind": "giving",
                "id": str(giving.id),
                "currency": currency,
                "amount": amount,
            }, status=201)

        if mode == 'donate':
            if type_val not in {'partner', 'project', 'mission'}:
                return Response({"error": "type must be partner|project|mission for donate"}, status=400)
            campaign_id = data.get('campaign_id')
            donation = Donation.objects.create(
                user=user,
                campaign_id=campaign_id,
                amount=amount,
                donation_type=type_val,
                status='pending',
            )
            return Response({
                "kind": "donation",
                "id": str(donation.id),
                "currency": currency,
                "amount": amount,
            }, status=201)

        return Response({"error": "mode must be 'give' or 'donate'"}, status=400)


class ContactSubmitView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'contact_submit'

    def post(self, request):
        data = request.data or {}
        # Rate limit: 10 per minute per IP
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR') or 'unknown'
        key = f"contact_rate:{ip}"
        count = cache.get(key, 0)
        if count and int(count) >= 10:
            return Response({"error": "Too many requests. Please try again shortly."}, status=429)
        cache.set(key, int(count) + 1, timeout=60)

        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()
        message = (data.get('message') or '').strip()

        if not is_valid_name(name):
            return Response({"error": "Please provide your real name."}, status=400)
        if not is_valid_email(email):
            return Response({"error": "Please provide a valid email address."}, status=400)
        if not is_human_text(message, optional=False):
            return Response({"error": "Message appears invalid. Avoid links/scripts and add a few words."}, status=400)

        EngagementLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            event_type='contact_submit',
            event_data={"name": name, "email": email, "message": message, "ip": ip},
        )
        return Response({"ok": True})


class AdminContactsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        limit = request.GET.get('limit')
        dt_from = request.GET.get('from')
        dt_to = request.GET.get('to')
        try:
            limit_n = max(1, min(int(limit or 100), 1000))
        except Exception:
            limit_n = 100
        params = ['contact_submit']
        where = ["event_type = %s"]
        if dt_from:
            where.append("created_at >= %s")
            params.append(dt_from)
        if dt_to:
            where.append("created_at <= %s")
            params.append(dt_to)
        params.append(limit_n)
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                select id, created_at, event_data
                from engagement_logs
                where {' and '.join(where)}
                order by created_at desc
                limit %s
                """,
                params
            )
            cols = [c[0] for c in cursor.description]
            rows = [dict(zip(cols, r)) for r in cursor.fetchall()]
        # Normalize
        out = []
        for row in rows:
            data = row.get('event_data') or {}
            out.append({
                'id': str(row.get('id')),
                'created_at': row.get('created_at'),
                'name': data.get('name'),
                'email': data.get('email'),
                'message': data.get('message'),
                'ip': data.get('ip'),
                'reviewed': data.get('reviewed') or False,
                'reviewed_at': data.get('reviewed_at'),
                'reviewer_id': data.get('reviewer_id'),
            })
        return Response(out)


class AdminContactsExportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        dt_from = request.GET.get('from')
        dt_to = request.GET.get('to')
        params = ['contact_submit']
        where = ["event_type = %s"]
        if dt_from:
            where.append("created_at >= %s")
            params.append(dt_from)
        if dt_to:
            where.append("created_at <= %s")
            params.append(dt_to)
        sql = f"""
            select id, created_at, event_data
            from engagement_logs
            where {' and '.join(where)}
            order by created_at desc
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="contacts_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['id','created_at','name','email','ip','message','reviewed','reviewed_at','reviewer_id'])
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            for row in cursor.fetchall():
                _id, created_at, data = row
                data = data or {}
                writer.writerow([
                    str(_id), created_at.isoformat() if created_at else '',
                    data.get('name') or '', data.get('email') or '',
                    data.get('ip') or '', (data.get('message') or '').replace('\n',' ').replace('\r',' '),
                    'true' if data.get('reviewed') else 'false',
                    data.get('reviewed_at') or '', data.get('reviewer_id') or ''
                ])
        return response


class PreparedExportCSVView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        kind = (request.GET.get('kind') or 'giving').lower()
        status_val = (request.GET.get('status') or 'pending').lower()
        response = HttpResponse(content_type='text/csv')
        if kind == 'donations':
            response['Content-Disposition'] = 'attachment; filename="prepared_donations.csv"'
            writer = csv.writer(response)
            writer.writerow(['id','user_id','donation_type','status','campaign_id','amount','created_at'])
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    select id, user_id, donation_type, status, campaign_id, amount, created_at
                    from donations
                    where status = %s
                    order by created_at desc
                    """,
                    [status_val]
                )
                for row in cursor.fetchall():
                    _id, user_id, donation_type, status_, campaign_id, amount, created_at = row
                    writer.writerow([str(_id), str(user_id) if user_id else '', donation_type, status_, str(campaign_id) if campaign_id else '', float(amount) if amount is not None else '', created_at.isoformat() if created_at else ''])
            return response
        else:
            response['Content-Disposition'] = 'attachment; filename="prepared_giving.csv"'
            writer = csv.writer(response)
            writer.writerow(['id','user_id','giving_type','method','status','amount','created_at'])
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    select id, user_id, giving_type, method, status, amount, created_at
                    from giving
                    where status = %s
                    order by created_at desc
                    """,
                    [status_val]
                )
                for row in cursor.fetchall():
                    _id, user_id, giving_type, method, status_, amount, created_at = row
                    writer.writerow([str(_id), str(user_id) if user_id else '', giving_type, method or '', status_, float(amount) if amount is not None else '', created_at.isoformat() if created_at else ''])
            return response


class NewsletterSubscribeView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'newsletter_subscribe'

    def post(self, request):
        data = request.data or {}
        # Rate limit: 10 per minute per IP
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR') or 'unknown'
        key = f"nl_rate:{ip}"
        count = cache.get(key, 0)
        if count and int(count) >= 10:
            return Response({"error": "Too many requests. Please try again shortly."}, status=429)
        cache.set(key, int(count) + 1, timeout=60)

        email = (data.get('email') or '').strip()
        if not is_valid_email(email):
            return Response({"error": "Please provide a valid email address."}, status=400)

        # Upsert subscriber
        sub, _ = NewsletterSubscriber.objects.get_or_create(email=email)
        sub.status = 'subscribed'
        if request.user.is_authenticated:
            sub.user = request.user
        sub.save()
        EngagementLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            event_type='newsletter_subscribe',
            event_data={"email": email, "ip": ip},
        )
        return Response({"ok": True})


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


class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        rf = getattr(settings, 'REST_FRAMEWORK', {}) or {}
        rates = rf.get('DEFAULT_THROTTLE_RATES', {}) or {}
        return Response({
            'throttle_rates': rates,
        })


class GivingByTypeReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Optional filters: from, to (ISO); status default succeeded+pending
        dt_from = request.GET.get('from')
        dt_to = request.GET.get('to')
        status_filter = request.GET.get('status')  # comma-separated
        statuses = [s.strip() for s in (status_filter.split(',') if status_filter else ['succeeded','pending'])]
        params = []
        where = ["giving_type in ('tithe','offering')"]
        if dt_from:
            where.append("created_at >= %s")
            params.append(dt_from)
        if dt_to:
            where.append("created_at <= %s")
            params.append(dt_to)
        if statuses:
            where.append("status = ANY(%s)")
            params.append(statuses)
        sql = f"""
            select giving_type, status, count(*) as tx_count, sum(amount) as total_amount
            from giving
            where {' and '.join(where)}
            group by giving_type, status
            order by giving_type, status
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            cols = [c[0] for c in cursor.description]
            rows = [dict(zip(cols, r)) for r in cursor.fetchall()]
        return Response(rows)


class DonationsByTypeReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        dt_from = request.GET.get('from')
        dt_to = request.GET.get('to')
        status_filter = request.GET.get('status')
        statuses = [s.strip() for s in (status_filter.split(',') if status_filter else ['succeeded','pending'])]
        params = []
        where = ["donation_type in ('partner','project','mission')"]
        if dt_from:
            where.append("created_at >= %s")
            params.append(dt_from)
        if dt_to:
            where.append("created_at <= %s")
            params.append(dt_to)
        if statuses:
            where.append("status = ANY(%s)")
            params.append(statuses)
        sql = f"""
            select donation_type, status, count(*) as tx_count, sum(amount) as total_amount
            from donations
            where {' and '.join(where)}
            group by donation_type, status
            order by donation_type, status
        """
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            cols = [c[0] for c in cursor.description]
            rows = [dict(zip(cols, r)) for r in cursor.fetchall()]
        return Response(rows)
