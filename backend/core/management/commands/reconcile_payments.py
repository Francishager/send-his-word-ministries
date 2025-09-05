import os
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Payment, PaymentWebhook

import stripe
from core.services import pesapal as pesapal_svc


class Command(BaseCommand):
    help = "Reconcile stale payments (older than 10 minutes with pending/processing status) using provider APIs."

    def add_arguments(self, parser):
        parser.add_argument(
            '--minutes', type=int, default=10,
            help='Age threshold in minutes to consider a payment stale (default 10)'
        )
        parser.add_argument(
            '--limit', type=int, default=200,
            help='Max number of payments to process in a run (default 200)'
        )

    def handle(self, *args, **options):
        minutes = options['minutes']
        limit = options['limit']
        cutoff = timezone.now() - timedelta(minutes=minutes)

        stale = Payment.objects.filter(
            status__in=['pending', 'processing'],
            updated_at__lt=cutoff,
        ).order_by('updated_at')[:limit]

        if not stale:
            self.stdout.write(self.style.SUCCESS('No stale payments found.'))
            return

        stripe_api_key = os.getenv('STRIPE_API_KEY')
        if stripe_api_key:
            stripe.api_key = stripe_api_key

        reconciled = 0
        processed = 0

        for p in stale:
            provider = (p.provider or '').lower()
            processed += 1
            try:
                if provider == 'stripe' and p.external_id and stripe_api_key:
                    pi = stripe.PaymentIntent.retrieve(p.external_id)
                    new_status = pi.get('status')
                    PaymentWebhook.objects.create(
                        provider='stripe',
                        event_type='cron.reconcile.provider.stripe',
                        signature_valid=True,
                        payment=p,
                        raw_payload={
                            'payment_intent': p.external_id,
                            'status': new_status,
                            'amount_received': pi.get('amount_received'),
                            'currency': pi.get('currency'),
                        },
                    )
                    if new_status and new_status != p.status:
                        p.status = new_status
                        p.save(update_fields=['status', 'updated_at'])
                        reconciled += 1
                elif provider == 'pesapal':
                    resp = pesapal_svc.get_transaction_status(
                        order_tracking_id=p.external_reference,
                        transaction_tracking_id=p.external_id,
                    )
                    status_inferred = pesapal_svc.infer_status_from_response(resp or {})
                    PaymentWebhook.objects.create(
                        provider='pesapal',
                        event_type='cron.reconcile.provider.pesapal' if resp else 'cron.reconcile.provider.pesapal.error',
                        signature_valid=True,
                        payment=p,
                        raw_payload={
                            'order_tracking_id': p.external_reference,
                            'transaction_tracking_id': p.external_id,
                            'response': resp,
                            'inferred_status': status_inferred,
                        },
                    )
                    if status_inferred and status_inferred != p.status:
                        p.status = status_inferred
                        p.save(update_fields=['status', 'updated_at'])
                        reconciled += 1
                else:
                    # Unsupported provider or missing identifiers; record noop for traceability
                    PaymentWebhook.objects.create(
                        provider=p.provider,
                        event_type='cron.reconcile.noop',
                        signature_valid=True,
                        payment=p,
                        raw_payload={'reason': 'unsupported-provider-or-missing-id'},
                    )
            except Exception as e:
                PaymentWebhook.objects.create(
                    provider=p.provider,
                    event_type='cron.reconcile.error',
                    signature_valid=True,
                    payment=p,
                    raw_payload={'error': str(e)},
                )
                continue

        self.stdout.write(self.style.SUCCESS(f'Processed {processed} payments, reconciled {reconciled} status updates.'))
