from django.contrib import admin
from . import models
from django.utils.translation import gettext_lazy as _
import os
import stripe
from core.services import pesapal as pesapal_svc

def _extract_status_from_webhook(provider: str, payload: dict) -> str | None:
    """Try to infer a payment status from a stored webhook payload.
    Supports common Stripe, PesaPal and generic mobile money structures.
    Returns a status string or None if undeterminable.
    """
    if not isinstance(payload, dict):
        return None
    provider = (provider or '').lower()
    try:
        if provider == 'stripe':
            evt_type = payload.get('type', '')
            obj = (payload.get('data') or {}).get('object') or {}
            if evt_type.startswith('payment_intent.'):
                # e.g., 'succeeded', 'processing', 'requires_payment_method'
                return obj.get('status')
            if evt_type.startswith('checkout.session.'):
                # e.g., 'paid', 'unpaid', map to succeeded/failed-ish
                pay_status = obj.get('payment_status')
                if pay_status == 'paid':
                    return 'succeeded'
                if pay_status == 'unpaid':
                    return 'failed'
                return pay_status
        elif provider == 'pesapal':
            # Many callbacks include 'status'
            return payload.get('status')
        elif provider == 'mobile_money':
            # Generic
            return payload.get('status')
    except Exception:
        return None
    return None

@admin.register(models.Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "start_time", "end_time", "created_by")
    search_fields = ("title", "description")
    list_filter = ("status",)

@admin.register(models.ServiceMoment)
class ServiceMomentAdmin(admin.ModelAdmin):
    list_display = ("title", "service", "start_time", "end_time")
    search_fields = ("title",)
    list_filter = ("service",)

@admin.register(models.ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("service", "sender", "message_type", "created_at")
    search_fields = ("message_text",)
    list_filter = ("message_type",)

@admin.register(models.PrayerRequest)
class PrayerRequestAdmin(admin.ModelAdmin):
    list_display = ("attendee", "minister", "service", "status", "created_at")
    list_filter = ("status",)

@admin.register(models.Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "service", "created_at")
    search_fields = ("title", "content")

@admin.register(models.BibleHighlight)
class BibleHighlightAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "chapter", "verse_start", "verse_end")
    search_fields = ("book",)

@admin.register(models.Devotion)
class DevotionAdmin(admin.ModelAdmin):
    list_display = ("title", "created_at")
    search_fields = ("title", "content")

@admin.register(models.DevotionInteraction)
class DevotionInteractionAdmin(admin.ModelAdmin):
    list_display = ("devotion", "user", "interaction_type", "created_at")

@admin.register(models.Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ("inviter", "invitee_email", "status", "sent_at", "accepted_at")
    list_filter = ("status",)

@admin.register(models.Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("referrer", "referee", "referral_code", "created_at")

@admin.register(models.DonationCampaign)
class DonationCampaignAdmin(admin.ModelAdmin):
    list_display = ("title", "goal_amount", "status", "start_date", "end_date")
    list_filter = ("status",)

@admin.register(models.Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("user", "campaign", "amount", "status", "donated_at")
    list_filter = ("status", "campaign")

@admin.register(models.Giving)
class GivingAdmin(admin.ModelAdmin):
    list_display = ("user", "service", "amount", "giving_type", "status", "processed_at")
    list_filter = ("giving_type", "status")

@admin.register(models.RecurringGiving)
class RecurringGivingAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "giving_type", "interval", "status")
    list_filter = ("giving_type", "interval", "status")

@admin.register(models.GivingReceipt)
class GivingReceiptAdmin(admin.ModelAdmin):
    list_display = ("giving", "receipt_number", "issued_at", "issued_to_email")
    search_fields = ("receipt_number", "issued_to_email")

@admin.register(models.Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("provider", "status", "amount", "currency", "giving", "donation", "external_id")
    list_filter = ("provider", "status")
    search_fields = ("external_id", "external_reference")
    actions = ("mark_as_refunded", "mark_as_failed", "reconcile_selected", "reconcile_with_provider",)

    @admin.action(description=_("Mark selected payments as refunded"))
    def mark_as_refunded(self, request, queryset):
        updated = 0
        for p in queryset.select_related("giving", "donation"):
            if p.status != 'refunded':
                p.status = 'refunded'
                p.save(update_fields=["status", "updated_at"])
                # Audit trail in webhooks table
                models.PaymentWebhook.objects.create(
                    provider=p.provider,
                    event_type='admin.manual_status_update',
                    signature_valid=True,
                    payment=p,
                    raw_payload={"action": "mark_refunded", "admin": getattr(request.user, 'email', str(request.user))},
                )
                updated += 1
        self.message_user(request, _("%d payment(s) marked as refunded.") % updated)

    @admin.action(description=_("Mark selected payments as failed"))
    def mark_as_failed(self, request, queryset):
        updated = 0
        for p in queryset.select_related("giving", "donation"):
            if p.status != 'failed':
                p.status = 'failed'
                p.save(update_fields=["status", "updated_at"])
                models.PaymentWebhook.objects.create(
                    provider=p.provider,
                    event_type='admin.manual_status_update',
                    signature_valid=True,
                    payment=p,
                    raw_payload={"action": "mark_failed", "admin": getattr(request.user, 'email', str(request.user))},
                )
                updated += 1
        self.message_user(request, _("%d payment(s) marked as failed.") % updated)

    @admin.action(description=_("Reconcile status from latest webhook"))
    def reconcile_selected(self, request, queryset):
        """Set payment.status based on the latest stored webhook for that payment if determinable.
        Best practice: do not fabricate receipts or alter financial amounts here; only update status
        and keep an audit record of the admin-driven reconciliation step.
        """
        reconciled = 0
        for p in queryset:
            latest = models.PaymentWebhook.objects.filter(payment=p).order_by('-received_at', '-created_at').first()
            if not latest:
                # Create an audit webhook noting reconciliation attempt with no data
                models.PaymentWebhook.objects.create(
                    provider=p.provider,
                    event_type='admin.reconcile.requested',
                    signature_valid=True,
                    payment=p,
                    raw_payload={"note": "no prior webhook found", "admin": getattr(request.user, 'email', str(request.user))},
                )
                continue
            new_status = _extract_status_from_webhook(p.provider, latest.raw_payload)
            models.PaymentWebhook.objects.create(
                provider=p.provider,
                event_type='admin.reconcile.applied' if new_status else 'admin.reconcile.noop',
                signature_valid=True,
                payment=p,
                raw_payload={"from_webhook_id": str(getattr(latest, 'id', '')), "inferred_status": new_status, "admin": getattr(request.user, 'email', str(request.user))},
            )
            if new_status and new_status != p.status:
                p.status = new_status
                p.save(update_fields=["status", "updated_at"])
                reconciled += 1
        self.message_user(request, _("%d payment(s) reconciled from latest webhook.") % reconciled)

    @admin.action(description=_("Re-run provider reconciliation (Stripe via PaymentIntent, PesaPal via API)"))
    def reconcile_with_provider(self, request, queryset):
        """Best practice: call provider API (Stripe or PesaPal) to fetch authoritative status by external_id.
        We only update status (not amounts) and log an audit webhook record.
        """
        reconciled = 0
        for p in queryset:
            provider = (p.provider or '').lower()
            if provider == 'stripe' and p.external_id:
                api_key = os.getenv("STRIPE_API_KEY")
                if not api_key:
                    continue
                stripe.api_key = api_key
                try:
                    pi = stripe.PaymentIntent.retrieve(p.external_id)
                    new_status = pi.get('status')
                    # Log audit entry with minimal data for compliance
                    models.PaymentWebhook.objects.create(
                        provider='stripe',
                        event_type='admin.reconcile.provider.stripe',
                        signature_valid=True,
                        payment=p,
                        raw_payload={
                            "payment_intent": p.external_id,
                            "status": new_status,
                            "amount_received": pi.get('amount_received'),
                            "currency": pi.get('currency'),
                            "admin": getattr(request.user, 'email', str(request.user)),
                        },
                    )
                    if new_status and new_status != p.status:
                        p.status = new_status
                        p.save(update_fields=["status", "updated_at"])
                        reconciled += 1
                except Exception as e:
                    # Record failure as an audit webhook
                    models.PaymentWebhook.objects.create(
                        provider='stripe',
                        event_type='admin.reconcile.provider.stripe.error',
                        signature_valid=True,
                        payment=p,
                        raw_payload={
                            "payment_intent": p.external_id,
                            "error": str(e),
                            "admin": getattr(request.user, 'email', str(request.user)),
                        },
                    )
                    continue
            elif provider == 'pesapal':
                try:
                    resp = pesapal_svc.get_transaction_status(
                        order_tracking_id=p.external_reference,
                        transaction_tracking_id=p.external_id,
                    )
                    status_inferred = pesapal_svc.infer_status_from_response(resp or {})
                    models.PaymentWebhook.objects.create(
                        provider='pesapal',
                        event_type='admin.reconcile.provider.pesapal' if resp else 'admin.reconcile.provider.pesapal.error',
                        signature_valid=True,
                        payment=p,
                        raw_payload={
                            "order_tracking_id": p.external_reference,
                            "transaction_tracking_id": p.external_id,
                            "response": resp,
                            "inferred_status": status_inferred,
                            "admin": getattr(request.user, 'email', str(request.user)),
                        },
                    )
                    if status_inferred and status_inferred != p.status:
                        p.status = status_inferred
                        p.save(update_fields=["status", "updated_at"])
                        reconciled += 1
                except Exception as e:
                    models.PaymentWebhook.objects.create(
                        provider='pesapal',
                        event_type='admin.reconcile.provider.pesapal.error',
                        signature_valid=True,
                        payment=p,
                        raw_payload={
                            "order_tracking_id": p.external_reference,
                            "transaction_tracking_id": p.external_id,
                            "error": str(e),
                            "admin": getattr(request.user, 'email', str(request.user)),
                        },
                    )
                    continue
        self.message_user(request, _("%d payment(s) reconciled from provider API.") % reconciled)

@admin.register(models.PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = ("provider", "event_type", "signature_valid", "received_at", "payment")
    list_filter = ("provider", "signature_valid")
    search_fields = ("event_id",)

@admin.register(models.Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("user", "service", "attended_at")
    list_filter = ("service",)

@admin.register(models.EngagementLog)
class EngagementLogAdmin(admin.ModelAdmin):
    list_display = ("user", "event_type", "created_at")
    search_fields = ("event_type",)

@admin.register(models.NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "user", "status", "subscribed_at")
    list_filter = ("status",)
