"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { useOrganizationStore } from "@/lib/stores/organization";
import ImportPlatformGrid from "@/components/dashboard/organizations/import/platform-grid";
import ImportSocialTrack from "@/components/dashboard/organizations/import/social-track";
import ImportCsvDropZone from "@/components/dashboard/organizations/import/csv-drop-zone";
import ImportReviewTable from "@/components/dashboard/organizations/import/review-table";
import ImportSuccessScreen from "@/components/dashboard/organizations/import/success-screen";
import type { ImportRow } from "@/lib/import/types";

export const dynamic = "force-dynamic";

type ImportStage = "landing" | "review" | "success";

export default function ImportPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeOrganization = useOrganizationStore((state) => state.activeOrganization);

  const [stage, setStage] = useState<ImportStage>("landing");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [importedCount, setImportedCount] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    if (!sessionPending && !session) router.push("/auth/login");
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!activeOrganization && !sessionPending && session) router.push("/dashboard");
  }, [activeOrganization, sessionPending, session, router]);

  // Handle OAuth redirect with ?session= param
  useEffect(() => {
    const sid = searchParams.get("session");
    if (!sid || stage !== "landing") return;
    setSessionId(sid);
    setSessionLoading(true);
    fetch(`/api/products/bulk-import/session?id=${sid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rows) {
          setRows(data.rows as ImportRow[]);
          setStage("review");
        }
      })
      .catch(console.error)
      .finally(() => setSessionLoading(false));
  }, [searchParams, stage]);

  if (typeof window === "undefined" || sessionPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return null;

  const handleCsvParsed = (parsedRows: ImportRow[]) => {
    setRows(parsedRows);
    setStage("review");
  };

  const handleConfirmed = (count: number) => {
    setImportedCount(count);
    setStage("success");
  };

  const handleReset = () => {
    setRows([]);
    setSessionId(undefined);
    setStage("landing");
    router.replace("/dashboard/organization/import");
  };

  return (
    <SidebarWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {sessionLoading && (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" label="Loading your listings..." />
          </div>
        )}

        {!sessionLoading && stage === "landing" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Import Products</h1>
              <p className="text-sm text-default-500 mt-1">
                Move your listings to MDFLD — whether you're on a marketplace, social media, or building from scratch.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <ImportPlatformGrid />
              <ImportSocialTrack />
            </div>
            <ImportCsvDropZone onParsed={handleCsvParsed} />
          </>
        )}

        {stage === "review" && (
          <ImportReviewTable
            rows={rows}
            sessionId={sessionId}
            onConfirmed={handleConfirmed}
            onBack={handleReset}
          />
        )}

        {stage === "success" && (
          <ImportSuccessScreen
            count={importedCount}
            onImportMore={handleReset}
          />
        )}
      </div>
    </SidebarWrapper>
  );
}
