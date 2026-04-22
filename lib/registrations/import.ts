import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ImportRow = {
  email: string;
  name?: string | null;
  attended?: boolean;
  verified?: boolean;
};

export type ImportSummary = {
  matched: number;
  attendedMarked: number;
  pending: number;
  skippedDuplicate: number;
  unmatchedEmails: string[];
};

export type ImportSource = "csv_upload" | "external_webhook";

// Upsert registrations + mark attendance, and buffer unmatched emails into
// pending_registrations for admin follow-up. Caller must have already
// verified the acting user is an org admin for `hostOrgId`.
export async function importRegistrations(params: {
  itemId: string;
  hostOrgId: string;
  rows: ImportRow[];
  source: ImportSource;
  actingMemberId: string;
  sourcePayload?: Record<string, unknown>;
}): Promise<ImportSummary> {
  const { itemId, hostOrgId, rows, source, actingMemberId } = params;
  const admin = getSupabaseAdmin();

  const normalized = rows
    .map((r) => ({
      ...r,
      email: (r.email ?? "").trim().toLowerCase(),
    }))
    .filter((r) => /.+@.+\..+/.test(r.email));

  if (normalized.length === 0) {
    return {
      matched: 0,
      attendedMarked: 0,
      pending: 0,
      skippedDuplicate: 0,
      unmatchedEmails: [],
    };
  }

  const emails = Array.from(new Set(normalized.map((r) => r.email)));

  const { data: memberRows, error: memErr } = await admin
    .from("members")
    .select("id, email")
    .in("email", emails);
  if (memErr) throw new Error(`members lookup failed: ${memErr.message}`);

  const idByEmail = new Map(
    (memberRows ?? []).map((m) => [
      (m as { email: string; id: string }).email.toLowerCase(),
      (m as { id: string }).id,
    ]),
  );

  // Existing registrations for dedupe — we'll flip attended where needed.
  const { data: existing, error: existErr } = await admin
    .from("item_registrations")
    .select("member_id, attended")
    .eq("item_id", itemId);
  if (existErr) throw new Error(`existing regs lookup failed: ${existErr.message}`);
  const existingByMember = new Map(
    (existing ?? []).map((r) => [
      (r as { member_id: string }).member_id,
      (r as { attended: boolean }).attended,
    ]),
  );

  let matched = 0;
  let attendedMarked = 0;
  let skippedDuplicate = 0;
  const unmatched: ImportRow[] = [];
  const toUpsert: Array<{
    item_id: string;
    member_id: string;
    source: ImportSource;
    attended: boolean;
    status: string;
    verified_by: string | null;
  }> = [];
  const attendanceActivitiesFor: string[] = []; // member_ids needing record_activity

  for (const row of normalized) {
    const memberId = idByEmail.get(row.email);
    if (!memberId) {
      unmatched.push(row);
      continue;
    }
    matched++;
    const nextAttended = row.attended === true;
    const wasRegistered = existingByMember.has(memberId);
    const wasAttended = existingByMember.get(memberId) === true;

    if (wasRegistered && wasAttended && nextAttended) {
      skippedDuplicate++;
      continue;
    }

    toUpsert.push({
      item_id: itemId,
      member_id: memberId,
      source,
      attended: nextAttended || wasAttended,
      status: "registered",
      verified_by: row.verified ? actingMemberId : null,
    });

    if (!wasAttended && nextAttended) {
      attendedMarked++;
      attendanceActivitiesFor.push(memberId);
    }
  }

  if (toUpsert.length > 0) {
    const { error: upErr } = await admin
      .from("item_registrations")
      .upsert(toUpsert, { onConflict: "item_id,member_id" });
    if (upErr) throw new Error(`item_registrations upsert failed: ${upErr.message}`);
  }

  // Fetch item title once for activity payload.
  if (attendanceActivitiesFor.length > 0) {
    const { data: itemRow } = await admin
      .from("items")
      .select("title")
      .eq("id", itemId)
      .maybeSingle();
    const title = (itemRow as { title: string } | null)?.title ?? "Event";
    for (const memberId of attendanceActivitiesFor) {
      const { error: rpcErr } = await admin.rpc("record_activity", {
        p_member: memberId,
        p_kind: "event_attended",
        p_host_org: hostOrgId,
        p_payload: {
          title,
          related_entity_id: itemId,
          related_entity_type: "item",
        },
      });
      if (rpcErr) throw new Error(`record_activity failed: ${rpcErr.message}`);
    }
  }

  // Buffer unmatched emails.
  if (unmatched.length > 0) {
    const payload = unmatched.map((r) => ({
      item_id: itemId,
      host_org_id: hostOrgId,
      email: r.email,
      name: r.name ?? null,
      attended: r.attended === true,
      source,
      source_payload: params.sourcePayload ?? {},
    }));
    const { error: pErr } = await admin
      .from("pending_registrations")
      .insert(payload);
    if (pErr) throw new Error(`pending insert failed: ${pErr.message}`);
  }

  return {
    matched,
    attendedMarked,
    pending: unmatched.length,
    skippedDuplicate,
    unmatchedEmails: unmatched.map((r) => r.email),
  };
}
