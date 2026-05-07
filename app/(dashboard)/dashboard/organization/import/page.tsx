"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { trpc } from "@/lib/trpc-client";
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

  const { data, isLoading: orgPending } = trpc.organization.get.useQuery(
    { slug: activeOrganization?.slug || "" },
    { enabled: !!activeOrganization?.slug && !!session },
  );
  const organization = data as any;

  const [stage, setStage] = useState<ImportStage>("landing");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [importedCount, setImportedCount] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"store" | "social" | "csv">("store");

  useEffect(() => {
    if (!sessionPending && !session) router.push("/auth/login");
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!activeOrganization && !sessionPending && session) router.push("/dashboard");
  }, [activeOrganization, sessionPending, session, router]);

  // Handle OAuth errors from eBay redirect
  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;
    const messages: Record<string, string> = {
      invalid_state: "Connection attempt expired or was tampered with. Please try again.",
      missing_params: "eBay did not return the expected data. Please try again.",
      ebay_token_failed: "Could not connect to eBay — the authorisation code may have expired. Please try again.",
      ebay_fetch_failed: "Connected to eBay but failed to fetch your listings. Please try again.",
      ebay_no_listings: "No listings found in your eBay account. If you list through eBay's website rather than their API, export your listings as CSV from eBay and upload them below.",
    };
    setUploadError(messages[error] ?? "Something went wrong connecting to eBay. Please try again.");
    router.replace("/dashboard/organization/import");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (typeof window === "undefined" || sessionPending || orgPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Please select an organization first</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Organization not found</p>
        </div>
      </div>
    );
  }

  if (organization?.role !== "owner" && organization?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">
            You don't have permission to access product import
          </p>
        </div>
      </div>
    );
  }

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
    setSessionLoading(false);
    setUploadError(null);
    router.replace("/dashboard/organization/import");
  };

  const handleCsvFile = (file: File) => {
    setUploadError(null);
    setSessionLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    fetch("/api/products/bulk-import/parse", { method: "POST", body: formData })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setUploadError(data.error ?? "Failed to parse file.");
          return;
        }
        if (data.rows?.length > 0) {
          setRows(data.rows as ImportRow[]);
          setStage("review");
        } else {
          setUploadError("No products found in this file.");
        }
      })
      .catch(() => setUploadError("Something went wrong. Please try again."))
      .finally(() => setSessionLoading(false));
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
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Import Products</h1>
              <p className="text-sm text-default-500 mt-1">
                Move your listings to MDFLD — whether you're on a marketplace, social media, or building from scratch.
              </p>
            </div>

            {/* Mobile: tab bar */}
            <div className="md:hidden">
              <div className="flex border-b border-divider mb-4">
                {(["store", "social", "csv"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-default-400"
                    }`}
                  >
                    {tab === "store" ? "Store" : tab === "social" ? "Social" : "CSV"}
                  </button>
                ))}
              </div>
              {activeTab === "store" && <ImportPlatformGrid onFilePicked={handleCsvFile} />}
              {activeTab === "social" && <ImportSocialTrack />}
              {activeTab === "csv" && (
                <>
                  <ImportCsvDropZone onParsed={handleCsvParsed} />
                  {uploadError && (
                    <p className="text-xs text-danger mt-2 text-center">{uploadError}</p>
                  )}
                </>
              )}
            </div>

            {/* Desktop: original grid */}
            <div className="hidden md:block">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <ImportPlatformGrid onFilePicked={handleCsvFile} />
                <ImportSocialTrack />
              </div>
              <ImportCsvDropZone onParsed={handleCsvParsed} />
              {uploadError && (
                <p className="text-xs text-danger mt-2 text-center">{uploadError}</p>
              )}
            </div>
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
