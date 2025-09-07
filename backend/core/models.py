import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

# Aliases for readability
User = settings.AUTH_USER_MODEL


class RoleRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    requested_role = models.ForeignKey('users.Role', on_delete=models.PROTECT, db_column='requested_role_id')
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'role_requests'
        unique_together = ('user', 'requested_role')


class UserRelationship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id_1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relationships_as_user1', db_column='user_id_1')
    user_id_2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relationships_as_user2', db_column='user_id_2')
    relationship_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'user_relationships'
        unique_together = ('user_id_1', 'user_id_2', 'relationship_type')


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField()
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    livestream_url = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='wait')  # wait|started|ended
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='created_by')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    # Stream metadata for provider-agnostic embeds
    # provider: youtube|vimeo|mux|generic
    stream_provider = models.CharField(max_length=20, blank=True, null=True)
    # For YouTube/Vimeo store video ID; for others store reference id if applicable
    stream_source_id = models.TextField(blank=True, null=True)
    # For mux/generic, a full embed URL can be provided
    stream_embed_url = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'services'


class ServiceMoment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, db_column='service_id')
    title = models.TextField()
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    pinned_content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'service_moments'


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, null=True, db_column='service_id')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='sender_id')
    message_text = models.TextField()
    message_type = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'chat_messages'


class PrayerRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='prayers_requested', db_column='attendee_id')
    minister = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='prayers_ministered', db_column='minister_id')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, db_column='service_id')
    content = models.TextField()
    type = models.TextField(blank=True, null=True)
    status = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    responded_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'prayer_requests'


class Notice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')
    title = models.TextField()
    content = models.TextField()
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, db_column='service_id')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'notices'


class BibleHighlight(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    book = models.TextField()
    chapter = models.IntegerField()
    verse_start = models.IntegerField()
    verse_end = models.IntegerField(blank=True, null=True)
    note = models.ForeignKey(Notice, on_delete=models.SET_NULL, null=True, db_column='note_id')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'bible_highlights'


class Devotion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField()
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'devotions'


class DevotionInteraction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    devotion = models.ForeignKey(Devotion, on_delete=models.CASCADE, db_column='devotion_id')
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    interaction_type = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'devotion_interactions'
        unique_together = ('devotion', 'user', 'interaction_type')


class Invite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, db_column='inviter_id')
    invitee_email = models.TextField()
    status = models.TextField(default='pending')
    sent_at = models.DateTimeField(blank=True, null=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'invites'


class Referral(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_made', db_column='referrer_id')
    referee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals_received', db_column='referee_id')
    referral_code = models.TextField(unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'referrals'


class DonationCampaign(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.TextField()
    description = models.TextField(blank=True, null=True)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.TextField(default='active')
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'donation_campaigns'


class Donation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    campaign = models.ForeignKey(DonationCampaign, on_delete=models.SET_NULL, null=True, db_column='campaign_id')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    # partner | project | mission
    donation_type = models.CharField(max_length=20, default='partner')
    status = models.TextField(default='pending')
    donated_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'donations'
        indexes = [
            models.Index(fields=['user'], name='idx_donations_user_dj'),
            models.Index(fields=['campaign'], name='idx_donations_campaign_dj'),
        ]


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, db_column='service_id')
    attended_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'attendance'
        unique_together = ('user', 'service', 'attended_at')


class EngagementLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    event_type = models.TextField()
    event_data = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'engagement_logs'


class NewsletterSubscriber(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')
    email = models.TextField(unique=True)
    subscribed_at = models.DateTimeField(default=timezone.now)
    status = models.TextField(default='subscribed')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'newsletter_subscribers'


class Giving(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='user_id')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, db_column='service_id')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    giving_type = models.CharField(max_length=20, default='offering')  # tithe/offering
    method = models.TextField(blank=True, null=True)
    reference = models.TextField(blank=True, null=True)
    status = models.TextField(default='pending')
    notes = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'giving'


class RecurringGiving(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    giving_type = models.CharField(max_length=20, default='tithe')
    interval = models.CharField(max_length=20, default='monthly')  # weekly, monthly, etc.
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(blank=True, null=True)
    status = models.TextField(default='active')
    last_run_at = models.DateTimeField(blank=True, null=True)
    next_run_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'recurring_giving'


class GivingReceipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    giving = models.ForeignKey(Giving, on_delete=models.CASCADE, db_column='giving_id')
    receipt_number = models.TextField(unique=True)
    issued_at = models.DateTimeField(default=timezone.now)
    issued_to_email = models.TextField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'giving_receipts'


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=50, default='initiated')
    status = models.CharField(max_length=50, default='initiated')
    currency = models.CharField(max_length=10, default='USD')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.TextField(blank=True, null=True)
    external_id = models.TextField(blank=True, null=True, unique=True)
    external_reference = models.TextField(blank=True, null=True)
    giving = models.ForeignKey(Giving, on_delete=models.SET_NULL, null=True, db_column='giving_id')
    donation = models.ForeignKey(Donation, on_delete=models.SET_NULL, null=True, db_column='donation_id')
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments'


class PaymentWebhook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.TextField()
    event_id = models.TextField(blank=True, null=True)
    event_type = models.TextField(blank=True, null=True)
    signature_valid = models.BooleanField(null=True)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, db_column='payment_id')
    raw_payload = models.JSONField()
    received_at = models.DateTimeField(default=timezone.now)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payment_webhooks'
