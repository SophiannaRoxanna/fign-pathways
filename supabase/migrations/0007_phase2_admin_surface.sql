-- Phase 2 — member-org admin surface.
-- Adds the tables + columns Phase 2 needs that aren't in the original schema:
-- webhook receiver secrets + external item mapping, pending registration buffer
-- for unmatched CSV/webhook emails, webhook event log (debugging), and
-- org_roster_visibility for member-opt-in rosters on public org pages.

-- 1. Webhook secret per organisation (nullable; rotated by admin).
alter table organisations
  add column if not exists webhook_secret text;

-- 2. External item reference for webhook mapping (external_ref → items.id).
alter table items
  add column if not exists external_ref text;

create unique index if not exists items_host_external_ref_idx
  on items(host_org_id, external_ref)
  where external_ref is not null;

-- 3. Pending registrations buffer: rows uploaded via CSV or webhook that didn't
-- match an existing members.email. Surfaced in the admin so coordinators can
-- trigger an invite or drop the row.
create table if not exists pending_registrations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  host_org_id uuid not null references organisations(id) on delete cascade,
  email text not null,
  name text,
  attended boolean not null default false,
  source registration_source not null,
  source_payload jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_action text, -- 'invited' | 'dismissed' | null while open
  created_at timestamptz not null default now()
);

create index if not exists pending_registrations_item_idx
  on pending_registrations(item_id);
create index if not exists pending_registrations_host_idx
  on pending_registrations(host_org_id, resolved_at);

alter table pending_registrations enable row level security;

create policy "pending: host org admin read"
  on pending_registrations for select
  using (is_org_admin(host_org_id));

create policy "pending: host org admin write"
  on pending_registrations for insert
  with check (is_org_admin(host_org_id));
create policy "pending: host org admin update"
  on pending_registrations for update
  using (is_org_admin(host_org_id));
create policy "pending: host org admin delete"
  on pending_registrations for delete
  using (is_org_admin(host_org_id));

-- 4. Webhook event log (for debugging + a "last 10 events" panel).
create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id) on delete cascade,
  item_id uuid references items(id) on delete set null,
  ok boolean not null,
  matched_count int not null default 0,
  pending_count int not null default 0,
  error text,
  received_at timestamptz not null default now()
);

create index if not exists webhook_events_org_idx
  on webhook_events(org_id, received_at desc);

alter table webhook_events enable row level security;

create policy "webhook_events: host org admin read"
  on webhook_events for select
  using (is_org_admin(org_id));

-- 5. Roster visibility — opt-in per org. Members toggle themselves.
create table if not exists org_roster_visibility (
  member_id uuid not null references members(id) on delete cascade,
  org_id uuid not null references organisations(id) on delete cascade,
  visible_in_public_roster boolean not null default false,
  added_at timestamptz not null default now(),
  primary key (member_id, org_id)
);

create index if not exists org_roster_visibility_org_idx
  on org_roster_visibility(org_id) where visible_in_public_roster;

alter table org_roster_visibility enable row level security;

-- Public read: anyone can see opt-in members for an org with a public page.
create policy "roster: public read of opt-ins"
  on org_roster_visibility for select
  using (visible_in_public_roster = true);

-- Member sees and manages their own rows regardless of visibility.
create policy "roster: member reads own rows"
  on org_roster_visibility for select
  using (auth.uid() = member_id);
create policy "roster: member writes own rows"
  on org_roster_visibility for insert
  with check (auth.uid() = member_id);
create policy "roster: member updates own rows"
  on org_roster_visibility for update
  using (auth.uid() = member_id);
create policy "roster: member deletes own rows"
  on org_roster_visibility for delete
  using (auth.uid() = member_id);

-- Org admin reads all rows for their org (even hidden ones).
create policy "roster: org admin reads all for their org"
  on org_roster_visibility for select
  using (is_org_admin(org_id));

-- 6. Allow host-org admins to INSERT item_registrations (for CSV/webhook).
-- Existing policy only permits members to insert their own row. The helper
-- import path calls this via the service role client, but we also add a
-- policy so organic org-admin writes go through RLS cleanly.
create policy "item_regs: host org admin insert"
  on item_registrations for insert
  with check (
    exists(
      select 1 from items
      where items.id = item_registrations.item_id
        and is_org_admin(items.host_org_id)
    )
  );
