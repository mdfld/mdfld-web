"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function ImportSocialTrack() {
  const router = useRouter();

  const handleDownload = () => {
    window.location.href = "/api/products/bulk-import/template";
  };

  return (
    <div className="bg-content1 border border-divider rounded-xl p-5 flex flex-col">
      <h2 className="text-sm font-semibold text-foreground mb-1">Social or informal</h2>
      <p className="text-xs text-default-400 mb-4">
        Selling on Instagram, WhatsApp, or without a proper storefront? We'll walk you through adding your products directly.
      </p>
      <div className="flex flex-col gap-2 mt-auto">
        <p className="text-xs text-default-500">
          Fill in our spreadsheet at your own pace — takes about 2 minutes per product — then upload it below.
        </p>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Icon icon="solar:download-outline" className="w-4 h-4" />}
          onPress={handleDownload}
        >
          Download template
        </Button>
        <Button
          variant="flat"
          size="sm"
          startContent={<Icon icon="solar:add-circle-linear" className="w-4 h-4" />}
          onPress={() => router.push("/dashboard/organization/listings")}
        >
          Add products one by one
        </Button>
      </div>
    </div>
  );
}
