"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface Props {
  count: number;
  onImportMore: () => void;
}

export default function ImportSuccessScreen({ count, onImportMore }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mb-6">
        <Icon icon="solar:check-circle-bold" className="w-8 h-8 text-success-600" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        {count} {count === 1 ? "product" : "products"} imported
      </h2>
      <p className="text-sm text-default-500 mb-8 max-w-sm">
        They're live in your listings as drafts. Review and publish them when you're ready.
      </p>
      <div className="flex gap-3">
        <Button variant="flat" onPress={onImportMore}>
          Import more
        </Button>
        <Button
          color="primary"
          endContent={<Icon icon="solar:arrow-right-outline" className="w-4 h-4" />}
          onPress={() => router.push("/dashboard/organization/listings")}
        >
          Go to Listings
        </Button>
      </div>
    </div>
  );
}
