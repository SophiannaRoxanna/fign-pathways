import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

// Escape a CSV cell per RFC 4180.
function csv(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type Row = {
  registered_at: string;
  status: string;
  source: string;
  attended: boolean;
  verified_by: string | null;
  members: {
    handle: string | null;
    name: string | null;
    email: string | null;
    country: string | null;
    city: string | null;
  } | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const { org, isUmbrella } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const { data: item } = await supabase
    .from("items")
    .select("host_org_id, title")
    .eq("id", id)
    .maybeSingle();
  if (!item) return new NextResponse("item not found", { status: 404 });
  const it = item as { host_org_id: string; title: string };
  if (it.host_org_id !== org.id && !isUmbrella) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const { data, error } = await supabase
    .from("item_registrations")
    .select(
      "registered_at, status, source, attended, verified_by, members(handle, name, email, country, city)",
    )
    .eq("item_id", id)
    .order("registered_at", { ascending: false });
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []) as unknown as Row[];
  const header = [
    "registered_at",
    "status",
    "source",
    "attended",
    "verified",
    "handle",
    "name",
    "email",
    "country",
    "city",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.registered_at,
        r.status,
        r.source,
        r.attended ? "yes" : "no",
        r.verified_by ? "yes" : "no",
        r.members?.handle ?? "",
        r.members?.name ?? "",
        r.members?.email ?? "",
        r.members?.country ?? "",
        r.members?.city ?? "",
      ]
        .map(csv)
        .join(","),
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  const safeTitle = it.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const filename = `${slug}_${safeTitle}_registrations_${date}.csv`;

  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
