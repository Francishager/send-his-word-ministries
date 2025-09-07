-- Supabase-ready normalized PostgreSQL schema
-- Run this once in Supabase SQL editor or via psql

-- Extensions
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- optional for case-insensitive text

-- Enum for services.status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'service_status') then
    create type service_status as enum ('wait', 'started', 'ended');
  end if;
end$$;

-- Trigger function to keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

-- USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  middle_name text,
  last_name text not null,
  email text not null unique,               -- change to citext if you want case-insensitive unique
  password text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

-- ROLES
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_roles_updated_at
before update on roles
for each row execute function set_updated_at();

-- USER_ROLES (many-to-many)
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role_id)
);
create index if not exists idx_user_roles_user on user_roles(user_id);
create index if not exists idx_user_roles_role on user_roles(role_id);
create trigger trg_user_roles_updated_at
before update on user_roles
for each row execute function set_updated_at();

-- ROLE_REQUESTS
create table if not exists role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  requested_role_id uuid not null references roles(id),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, requested_role_id)
);
create index if not exists idx_role_requests_user on role_requests(user_id);
create index if not exists idx_role_requests_role on role_requests(requested_role_id);
create trigger trg_role_requests_updated_at
before update on role_requests
for each row execute function set_updated_at();

-- USER_RELATIONSHIPS
create table if not exists user_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references users(id) on delete cascade,
  user_id_2 uuid not null references users(id) on delete cascade,
  relationship_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_user_rel_not_self check (user_id_1 <> user_id_2),
  unique (user_id_1, user_id_2, relationship_type)
);
create index if not exists idx_user_rel_user1 on user_relationships(user_id_1);
create index if not exists idx_user_rel_user2 on user_relationships(user_id_2);
create trigger trg_user_relationships_updated_at
before update on user_relationships
for each row execute function set_updated_at();

-- SERVICES
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  livestream_url text,
  status text NOT NULL CHECK (status IN ('wait','started','ended')) DEFAULT 'wait',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_services_created_by on services(created_by);
create trigger trg_services_updated_at
before update on services
for each row execute function set_updated_at();

-- SERVICE_MOMENTS
create table if not exists service_moments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  title text not null,
  start_time timestamptz,
  end_time timestamptz,
  pinned_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_service_moments_service on service_moments(service_id);
create trigger trg_service_moments_updated_at
before update on service_moments
for each row execute function set_updated_at();

-- CHAT_MESSAGES
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  sender_id uuid references users(id) on delete set null,
  message_text text not null,
  message_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_chat_msgs_service on chat_messages(service_id);
create index if not exists idx_chat_msgs_sender on chat_messages(sender_id);
create trigger trg_chat_messages_updated_at
before update on chat_messages
for each row execute function set_updated_at();

-- PRAYER_REQUESTS
create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references users(id) on delete set null,
  minister_id uuid references users(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  content text not null,
  type text,
  status text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists idx_prayer_requests_attendee on prayer_requests(attendee_id);
create index if not exists idx_prayer_requests_minister on prayer_requests(minister_id);
create index if not exists idx_prayer_requests_service on prayer_requests(service_id);
create trigger trg_prayer_requests_updated_at
before update on prayer_requests
for each row execute function set_updated_at();

-- NOTICES
create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  title text not null,
  content text not null,
  service_id uuid references services(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_notices_user on notices(user_id);
create index if not exists idx_notices_service on notices(service_id);
create trigger trg_notices_updated_at
before update on notices
for each row execute function set_updated_at();

-- BIBLE_HIGHLIGHTS
create table if not exists bible_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  book text not null,
  chapter int not null,
  verse_start int not null,
  verse_end int,
  note_id uuid references notices(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bible_highlights_user on bible_highlights(user_id);
create trigger trg_bible_highlights_updated_at
before update on bible_highlights
for each row execute function set_updated_at();

-- RLS for bible_highlights: user can CRUD their own highlights
alter table if exists bible_highlights enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bible_highlights' and policyname = 'bible_highlights_select_own'
  ) then
    create policy bible_highlights_select_own on bible_highlights for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bible_highlights' and policyname = 'bible_highlights_insert_own'
  ) then
    create policy bible_highlights_insert_own on bible_highlights for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bible_highlights' and policyname = 'bible_highlights_update_own'
  ) then
    create policy bible_highlights_update_own on bible_highlights for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'bible_highlights' and policyname = 'bible_highlights_delete_own'
  ) then
    create policy bible_highlights_delete_own on bible_highlights for delete using (auth.uid() = user_id);
  end if;
end $$;

-- DEVOTIONS
create table if not exists devotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_devotions_updated_at
before update on devotions
for each row execute function set_updated_at();

-- DEVOTION_INTERACTIONS
create table if not exists devotion_interactions (
  id uuid primary key default gen_random_uuid(),
  devotion_id uuid not null references devotions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  interaction_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (devotion_id, user_id, interaction_type)
);
create index if not exists idx_dev_interactions_devotion on devotion_interactions(devotion_id);
create index if not exists idx_dev_interactions_user on devotion_interactions(user_id);
create trigger trg_devotion_interactions_updated_at
before update on devotion_interactions
for each row execute function set_updated_at();

-- INVITES
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references users(id) on delete cascade,
  invitee_email text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invites_inviter on invites(inviter_id);
create trigger trg_invites_updated_at
before update on invites
for each row execute function set_updated_at();

-- REFERRALS
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references users(id) on delete cascade,
  referee_id uuid not null references users(id) on delete cascade,
  referral_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_ref_not_self check (referrer_id <> referee_id)
);
create index if not exists idx_referrals_referrer on referrals(referrer_id);
create index if not exists idx_referrals_referee on referrals(referee_id);
create trigger trg_referrals_updated_at
before update on referrals
for each row execute function set_updated_at();

-- DONATION_CAMPAIGNS
create table if not exists donation_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  goal_amount numeric(12,2) not null,
  status text not null default 'active',
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_donation_campaigns_updated_at
before update on donation_campaigns
for each row execute function set_updated_at();

-- DONATIONS
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  campaign_id uuid references donation_campaigns(id) on delete set null,
  amount numeric(12,2) not null,
  donation_type text not null check (donation_type in ('partner','project','mission')) default 'partner',
  status text not null default 'pending',
  donated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_donations_user on donations(user_id);
create index if not exists idx_donations_campaign on donations(campaign_id);
create trigger trg_donations_updated_at
before update on donations
for each row execute function set_updated_at();

-- ATTENDANCE
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  attended_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, service_id, attended_at)
);
create index if not exists idx_attendance_user on attendance(user_id);
create index if not exists idx_attendance_service on attendance(service_id);
create trigger trg_attendance_updated_at
before update on attendance
for each row execute function set_updated_at();

-- ENGAGEMENT_LOGS
create table if not exists engagement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_engagement_logs_user on engagement_logs(user_id);
create index if not exists idx_engagement_logs_event_type on engagement_logs(event_type);
create trigger trg_engagement_logs_updated_at
before update on engagement_logs
for each row execute function set_updated_at();

-- NEWSLETTER_SUBSCRIBERS
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  status text not null default 'subscribed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_newsletter_user on newsletter_subscribers(user_id);
create trigger trg_newsletter_subscribers_updated_at
before update on newsletter_subscribers
for each row execute function set_updated_at();

-- GIVING (offerings/tithes separate from donations)
create table if not exists giving (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  amount numeric(12,2) not null,
  giving_type text not null check (giving_type in ('tithe','offering')) default 'offering',
  method text,                           -- e.g., 'card','mobile_money','cash','bank_transfer'
  reference text,                        -- external transaction reference if applicable
  status text not null default 'pending',-- e.g., 'pending','succeeded','failed','refunded'
  notes text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_giving_user on giving(user_id);
create index if not exists idx_giving_service on giving(service_id);
create index if not exists idx_giving_type on giving(giving_type);
create index if not exists idx_giving_status on giving(status);
create trigger trg_giving_updated_at
before update on giving
for each row execute function set_updated_at();

-- RECURRING_GIVING (optional recurring commitments)
create table if not exists recurring_giving (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(12,2) not null,
  giving_type text not null check (giving_type in ('tithe','offering','seed','other')) default 'tithe',
  interval text not null check (interval in ('weekly','biweekly','monthly','quarterly','yearly')) default 'monthly',
  start_date timestamptz not null default now(),
  end_date timestamptz,
  status text not null default 'active',         -- 'active','paused','cancelled','completed'
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_recurring_giving_user on recurring_giving(user_id);
create index if not exists idx_recurring_giving_status on recurring_giving(status);
create trigger trg_recurring_giving_updated_at
before update on recurring_giving
for each row execute function set_updated_at();

-- GIVING_RECEIPTS
create table if not exists giving_receipts (
  id uuid primary key default gen_random_uuid(),
  giving_id uuid not null references giving(id) on delete cascade,
  receipt_number text not null unique,
  issued_at timestamptz not null default now(),
  issued_to_email text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_giving_receipts_giving on giving_receipts(giving_id);
create trigger trg_giving_receipts_updated_at
before update on giving_receipts
for each row execute function set_updated_at();

-- PAYMENTS (ties external providers to giving/donations)
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe','pesapal','mobile_money','mpesa','airtel_money','paypal','cash','bank_transfer','other')),
  status text not null check (status in ('initiated','pending','succeeded','failed','refunded','cancelled')) default 'initiated',
  currency text not null default 'USD',
  amount numeric(12,2) not null,
  method text,                                 -- card, stk_push, ussd, etc.
  external_id text unique,                      -- provider charge/checkout id
  external_reference text,                      -- secondary ref (receipt, merchant ref)
  giving_id uuid references giving(id) on delete set null,
  donation_id uuid references donations(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_payment_link_one check (
    (giving_id is not null and donation_id is null) or
    (giving_id is null and donation_id is not null)
  )
);
create index if not exists idx_payments_provider on payments(provider);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_giving on payments(giving_id);
create index if not exists idx_payments_donation on payments(donation_id);
create trigger trg_payments_updated_at
before update on payments
for each row execute function set_updated_at();

-- PAYMENT_WEBHOOKS (raw provider webhook events)
create table if not exists payment_webhooks (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text,                               -- provider event id if any
  event_type text,
  signature_valid boolean,                      -- true if signature verified
  payment_id uuid references payments(id) on delete set null,
  raw_payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_webhooks_provider on payment_webhooks(provider);
create index if not exists idx_webhooks_payment on payment_webhooks(payment_id);
create trigger trg_payment_webhooks_updated_at
before update on payment_webhooks
for each row execute function set_updated_at();

-- BLOG_POSTS
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  content_html text not null,
  cover_image text,
  tags text[],
  status text not null check (status in ('draft','pending_review','published','archived')) default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_posts_author on blog_posts(author_id);
create index if not exists idx_blog_posts_status on blog_posts(status);
create trigger trg_blog_posts_updated_at
before update on blog_posts
for each row execute function set_updated_at();

-- BLOG_POSTS
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references users(id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  content_html text not null,
  cover_image text,
  tags text[],
  status text not null check (status in ('draft','pending_review','published','archived')) default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_posts_author on blog_posts(author_id);
create index if not exists idx_blog_posts_status on blog_posts(status);
create trigger trg_blog_posts_updated_at
before update on blog_posts
for each row execute function set_updated_at();

-- BLOG_COMMENTS
create table if not exists blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  parent_id uuid references blog_comments(id) on delete cascade,
  content text not null,
  status text not null check (status in ('pending','approved','rejected','spam')) default 'pending',
  likes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_comments_post on blog_comments(post_id);
create index if not exists idx_blog_comments_user on blog_comments(user_id);
create index if not exists idx_blog_comments_parent on blog_comments(parent_id);
create index if not exists idx_blog_comments_status on blog_comments(status);
create trigger trg_blog_comments_updated_at
before update on blog_comments
for each row execute function set_updated_at();

-- Enable RLS and basic policies for Supabase direct access
alter table if exists blog_posts enable row level security;
alter table if exists blog_comments enable row level security;
alter table if exists testimonies enable row level security;

-- Blog posts: public can read only published
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blog_posts' and policyname = 'blog_posts_select_published'
  ) then
    create policy blog_posts_select_published on blog_posts for select using (status = 'published');
  end if;
end $$;

-- Blog comments: public can read approved; authenticated can insert; users can update/delete their own.
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blog_comments' and policyname = 'blog_comments_select_approved'
  ) then
    create policy blog_comments_select_approved on blog_comments for select using (status = 'approved');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blog_comments' and policyname = 'blog_comments_insert_auth'
  ) then
    create policy blog_comments_insert_auth on blog_comments for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blog_comments' and policyname = 'blog_comments_update_own'
  ) then
    create policy blog_comments_update_own on blog_comments for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'blog_comments' and policyname = 'blog_comments_delete_own'
  ) then
    create policy blog_comments_delete_own on blog_comments for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Testimonies: public read approved; authenticated can insert; users can update/delete their own
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonies' and policyname = 'testimonies_select_approved_or_own'
  ) then
    create policy testimonies_select_approved_or_own on testimonies for select using (approved = true or auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonies' and policyname = 'testimonies_insert_auth'
  ) then
    create policy testimonies_insert_auth on testimonies for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonies' and policyname = 'testimonies_update_own'
  ) then
    create policy testimonies_update_own on testimonies for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'testimonies' and policyname = 'testimonies_delete_own'
  ) then
    create policy testimonies_delete_own on testimonies for delete using (auth.uid() = user_id);
  end if;
end $$;

-- TESTIMONIES
create table if not exists testimonies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  name text,                                  -- snapshot of submitter's display name
  title text not null,
  content text not null,
  user_image_url text,                        -- submitter profile/proof image
  media_image_url text,                       -- optional testimony media image
  media_video_url text,                       -- optional testimony media video
  approved boolean not null default false,    -- moderation flag
  priority int not null default 0,            -- for ordering in UI (lower first or custom)
  published_at timestamptz,                   -- when approved/published
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_testimonies_user on testimonies(user_id);
create index if not exists idx_testimonies_approved on testimonies(approved);
create index if not exists idx_testimonies_priority on testimonies(priority);
create trigger trg_testimonies_updated_at
before update on testimonies
for each row execute function set_updated_at();

-- REPORTING VIEWS
-- Weekly and monthly summaries for Giving
create or replace view v_giving_summary_weekly as
select
  date_trunc('week', created_at) as week_start,
  giving_type,
  service_id,
  status,
  count(*) as tx_count,
  sum(amount) as total_amount
from giving
group by 1,2,3,4;

create or replace view v_giving_summary_monthly as
select
  date_trunc('month', created_at) as month_start,
  giving_type,
  service_id,
  status,
  count(*) as tx_count,
  sum(amount) as total_amount
from giving
group by 1,2,3,4;

-- Weekly and monthly summaries for Donations
create or replace view v_donations_summary_weekly as
select
  date_trunc('week', created_at) as week_start,
  campaign_id,
  status,
  count(*) as tx_count,
  sum(amount) as total_amount
from donations
group by 1,2,3;

create or replace view v_donations_summary_monthly as
select
  date_trunc('month', created_at) as month_start,
  campaign_id,
  status,
  count(*) as tx_count,
  sum(amount) as total_amount
from donations
group by 1,2,3;

-- Optional: materialized views for faster dashboards (refresh manually or via cron)
create materialized view if not exists mv_giving_summary_weekly as
select * from v_giving_summary_weekly with no data;

create materialized view if not exists mv_giving_summary_monthly as
select * from v_giving_summary_monthly with no data;

create materialized view if not exists mv_donations_summary_weekly as
select * from v_donations_summary_weekly with no data;

create materialized view if not exists mv_donations_summary_monthly as
select * from v_donations_summary_monthly with no data;

-- Helper function to refresh all materialized views
create or replace function refresh_reporting_materialized_views()
returns void language plpgsql as $$
begin
  refresh materialized view concurrently mv_giving_summary_weekly;
  refresh materialized view concurrently mv_giving_summary_monthly;
  refresh materialized view concurrently mv_donations_summary_weekly;
  refresh materialized view concurrently mv_donations_summary_monthly;
end;$$;

-- COUNTDOWNS (for live page timers)
create table if not exists countdowns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_time timestamptz not null,
  active boolean not null default true,
  service_id uuid references services(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_countdowns_active on countdowns(active);
create index if not exists idx_countdowns_service on countdowns(service_id);
create trigger trg_countdowns_updated_at
before update on countdowns
for each row execute function set_updated_at();

alter table if exists countdowns enable row level security;

-- Public can read only active countdowns
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'countdowns' and policyname = 'countdowns_select_active'
  ) then
    create policy countdowns_select_active on countdowns for select using (active = true);
  end if;
end $$;

-- Authenticated users can insert/update (app UI will restrict by role)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'countdowns' and policyname = 'countdowns_insert_auth'
  ) then
    create policy countdowns_insert_auth on countdowns for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'countdowns' and policyname = 'countdowns_update_auth'
  ) then
    create policy countdowns_update_auth on countdowns for update using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'countdowns' and policyname = 'countdowns_delete_auth'
  ) then
    create policy countdowns_delete_auth on countdowns for delete using (auth.role() = 'authenticated');
  end if;
end $$;

-- Public read for this bucket
create policy "public read public-media"
on storage.objects for select
to public
using (bucket_id = 'public-media');

-- Authenticated users can upload (insert) into this bucket
create policy "auth upload public-media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'public-media');

-- Optional: authenticated users may update their objects
create policy "auth update public-media"
on storage.objects for update
to authenticated
using (bucket_id = 'public-media');

-- Optional: authenticated users may delete their objects
create policy "auth delete public-media"
on storage.objects for delete
to authenticated
using (bucket_id = 'public-media');