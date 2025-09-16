"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  Button,
  Chip,
  User,
  Progress,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const returnRequests = [
  {
    id: "RET-001",
    product: "Nike Phantom Boots",
    image:
      "https://images.unsplash.com/photo-1544966503-7a9ae2e5e3c8?w=100&h=100&fit=crop",
    reason: "Size too small",
    status: "approved",
    progress: 75,
    refund: "$279",
  },
  {
    id: "RET-002",
    product: "Soccer Jersey",
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop",
    reason: "Wrong color",
    status: "processing",
    progress: 25,
    refund: "$99",
  },
  {
    id: "RET-003",
    product: "Training Ball",
    image:
      "https://images.unsplash.com/photo-1606920420527-f9edf6939e46?w=100&h=100&fit=crop",
    reason: "Defective",
    status: "completed",
    progress: 100,
    refund: "$45",
  },
  {
    id: "RET-004",
    product: "Shin Guards",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop",
    reason: "Not as described",
    status: "approved",
    progress: 50,
    refund: "$35",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "success";
    case "approved":
      return "primary";
    case "processing":
      return "warning";
    default:
      return "default";
  }
};

export const ReturnsSection = () => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center w-full">
          <div>
            <h3 className="text-lg font-semibold">Returns & Refunds</h3>
            <p className="text-small text-default-500">
              {returnRequests.length} active returns
            </p>
          </div>
          <Button
            variant="light"
            size="sm"
            color="primary"
            endContent={<Icon icon="solar:add-circle-linear" />}
          >
            New Return
          </Button>
        </div>
      </CardHeader>

      <Table
        isCompact
        removeWrapper
        aria-label="Returns tracking table"
        className="h-[320px]"
        classNames={{
          base: "h-full",
          th: [
            "bg-transparent",
            "text-default-500",
            "border-b",
            "border-divider",
          ],
          td: ["border-b", "border-divider/50"],
          wrapper: "h-full flex flex-col",
          table: "flex-grow",
        }}
      >
        <TableHeader>
          <TableColumn>PRODUCT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>PROGRESS</TableColumn>
          <TableColumn align="center">REFUND</TableColumn>
        </TableHeader>
        <TableBody>
          {returnRequests.map((returnItem) => (
            <TableRow key={returnItem.id}>
              <TableCell>
                <User
                  avatarProps={{
                    radius: "md",
                    src: returnItem.image,
                    size: "sm",
                  }}
                  description={
                    <span className="text-default-400">
                      {returnItem.reason}
                    </span>
                  }
                  name={returnItem.product}
                  classNames={{
                    name: "text-default-700 font-medium",
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  color="primary"
                  size="sm"
                  variant="dot"
                  className="capitalize border-none gap-1 text-primary"
                >
                  {returnItem.status}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={returnItem.progress}
                    color="primary"
                    size="sm"
                    className="w-16"
                  />
                  <span className="text-tiny text-default-500 min-w-[35px]">
                    {returnItem.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-center">
                  <span className="text-primary font-semibold">
                    {returnItem.refund}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
