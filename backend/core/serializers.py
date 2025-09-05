from rest_framework import serializers
from .models import (
    Service, ServiceMoment, ChatMessage, PrayerRequest, Notice, BibleHighlight,
    Devotion, DevotionInteraction, Invite, Referral, DonationCampaign, Donation,
    Attendance, EngagementLog, NewsletterSubscriber, Giving, RecurringGiving, GivingReceipt,
    Payment, PaymentWebhook
)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class DonationCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationCampaign
        fields = '__all__'


class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = '__all__'

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class GivingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Giving
        fields = '__all__'

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

    def validate_amount(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Amount must be non-negative")
        return value


class PaymentWebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentWebhook
        fields = '__all__'


# Optional additional serializers (stubs for future endpoints)
class ServiceMomentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceMoment
        fields = '__all__'


class PrayerRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrayerRequest
        fields = '__all__'


class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'


class BibleHighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = BibleHighlight
        fields = '__all__'


class DevotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Devotion
        fields = '__all__'


class DevotionInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DevotionInteraction
        fields = '__all__'


class InviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invite
        fields = '__all__'


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class EngagementLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngagementLog
        fields = '__all__'


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = '__all__'
