"use client";

import Link from "next/link";
import { Projector } from "lucide-react";
import StatusMessage, { STATUS_PRIMARY_BUTTON, STATUS_SECONDARY_BUTTON } from "@/components/StatusMessage";

interface FranchiseVaultErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Shown when the Vault can't reach its catalog (e.g. Convex unreachable). */
export default function FranchiseVaultError({ reset }: FranchiseVaultErrorProps) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#020817] pb-16 text-slate-100">
      <StatusMessage
        icon={Projector}
        tone="alert"
        title="The projector jammed"
        body="We couldn’t fetch the franchise list. Your watched films are safe, so give it another spin."
        actions={
          <>
            <button type="button" onClick={reset} className={STATUS_PRIMARY_BUTTON}>
              Try again
            </button>
            <Link href="/" className={STATUS_SECONDARY_BUTTON}>
              Back to home
            </Link>
          </>
        }
      />
    </main>
  );
}
