import { Card, CardBody, Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Banner Skeleton */}
      <Skeleton className="w-full h-48 rounded-lg mb-4" />

      {/* Profile Header Skeleton */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <div className="text-center md:text-left w-full">
                <Skeleton className="h-8 w-48 mb-2 rounded" />
                <Skeleton className="h-5 w-32 mb-2 rounded" />
                <div className="flex gap-2 mb-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2 rounded" />
              <Skeleton className="h-4 w-3/4 mb-4 rounded" />

              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Seller Profile Skeleton */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <Skeleton className="h-6 w-40 mb-4 rounded" />
          <Skeleton className="h-5 w-48 mb-2 rounded" />
          <Skeleton className="h-4 w-full mb-4 rounded" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </CardBody>
      </Card>

      {/* Content Area Skeleton */}
      <Card>
        <CardBody className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
