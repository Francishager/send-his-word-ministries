from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, DonationCampaignViewSet, DonationViewSet, GivingViewSet, PaymentViewSet,
    StripeWebhookView, PesapalWebhookView, MobileMoneyWebhookView,
    GivingSummaryWeeklyView, GivingSummaryMonthlyView,
    DonationsSummaryWeeklyView, DonationsSummaryMonthlyView,
    RefreshReportingMaterializedViews,
)

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='services')
router.register(r'donation-campaigns', DonationCampaignViewSet, basename='donation-campaigns')
router.register(r'donations', DonationViewSet, basename='donations')
router.register(r'giving', GivingViewSet, basename='giving')
router.register(r'payments', PaymentViewSet, basename='payments')

urlpatterns = [
    path('', include(router.urls)),
    path('payments/webhooks/stripe', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('payments/webhooks/pesapal', PesapalWebhookView.as_view(), name='pesapal-webhook'),
    path('payments/webhooks/mobile-money', MobileMoneyWebhookView.as_view(), name='mobile-money-webhook'),

    # Reports
    path('reports/giving/weekly', GivingSummaryWeeklyView.as_view(), name='giving-weekly'),
    path('reports/giving/monthly', GivingSummaryMonthlyView.as_view(), name='giving-monthly'),
    path('reports/donations/weekly', DonationsSummaryWeeklyView.as_view(), name='donations-weekly'),
    path('reports/donations/monthly', DonationsSummaryMonthlyView.as_view(), name='donations-monthly'),
    path('reports/refresh', RefreshReportingMaterializedViews.as_view(), name='reports-refresh'),
]
