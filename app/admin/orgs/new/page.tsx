import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgForm } from "@/components/admin/OrgForm";
import { createOrgAction, createOrgAndNewItemAction } from "./actions";

export default function NewOrgPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/orgs"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← organisations
        </Link>
      </div>
      <SectionHead
        num="01a"
        kicker="new organisation"
        sub="Onboard a member org, partner, or chapter. They keep their brand — FIGN federates them."
      >
        Add an <em>organisation</em>.
      </SectionHead>

      <OrgForm
        action={createOrgAction}
        secondaryAction={createOrgAndNewItemAction}
        secondaryLabel="Save & post first item →"
        submitLabel="Save"
      />
    </div>
  );
}
