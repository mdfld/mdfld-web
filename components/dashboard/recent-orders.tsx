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
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

const allOrders = [
  {
    id: "ORD-001",
    product: "Nike Phantom GT Elite",
    image:
      "https://images.unsplash.com/photo-1544966503-7a9ae2e5e3c8?w=100&h=100&fit=crop",
    price: "$279",
    status: "delivered",
    date: "Dec 18",
  },
  {
    id: "ORD-002",
    product: "Barcelona Home Jersey",
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop",
    price: "$99",
    status: "shipped",
    date: "Dec 17",
  },
  {
    id: "ORD-003",
    product: "Adidas Copa Mundial",
    image:
      "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=100&h=100&fit=crop",
    price: "$199",
    status: "processing",
    date: "Dec 18",
  },
  {
    id: "ORD-004",
    product: "Soccer Training Cones Set",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&h=100&fit=crop",
    price: "$29",
    status: "delivered",
    date: "Dec 16",
  },
  {
    id: "ORD-005",
    product: "Puma Future Z Boots",
    image:
      "https://images.unsplash.com/photo-1544966503-7a9ae2e5e3c8?w=100&h=100&fit=crop",
    price: "$249",
    status: "shipped",
    date: "Dec 15",
  },
  {
    id: "ORD-006",
    product: "Real Madrid Away Kit",
    image:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop",
    price: "$119",
    status: "delivered",
    date: "Dec 14",
  },
  {
    id: "ORD-007",
    product: "UEFA Champions League Ball",
    image:
      "https://images.unsplash.com/photo-1606920420527-f9edf6939e46?w=100&h=100&fit=crop",
    price: "$159",
    status: "processing",
    date: "Dec 13",
  },
];

export const RecentOrders = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 4;
  const pages = Math.ceil(allOrders.length / rowsPerPage);

  const items = allOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center w-full">
          <div>
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <p className="text-small text-default-500">
              {allOrders.length} total orders
            </p>
          </div>
          <Button
            variant="light"
            size="sm"
            color="primary"
            endContent={<Icon icon="solar:arrow-right-linear" />}
          >
            View All
          </Button>
        </div>
      </CardHeader>

      <Table
        isCompact
        removeWrapper
        aria-label="Recent orders table"
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
        bottomContent={
          <div className="flex w-full justify-between items-center px-2">
            <span className="text-tiny text-default-400">
              Showing {(page - 1) * rowsPerPage + 1} to{" "}
              {Math.min(page * rowsPerPage, allOrders.length)} of{" "}
              {allOrders.length}
            </span>
            <div className="flex gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="primary"
                isDisabled={page === 1}
                onPress={() => setPage(page - 1)}
                className="w-7 h-7 min-w-0"
              >
                <Icon icon="solar:arrow-left-linear" width={14} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="primary"
                isDisabled={page === pages}
                onPress={() => setPage(page + 1)}
                className="w-7 h-7 min-w-0"
              >
                <Icon icon="solar:arrow-right-linear" width={14} />
              </Button>
            </div>
          </div>
        }
        bottomContentPlacement="outside"
      >
        <TableHeader>
          <TableColumn>PRODUCT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>DATE</TableColumn>
          <TableColumn align="center">ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {items.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <User
                  avatarProps={{
                    radius: "md",
                    src: order.image,
                    size: "sm",
                  }}
                  description={
                    <span className="text-primary font-semibold">
                      {order.price}
                    </span>
                  }
                  name={order.product}
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
                  {order.status}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-small text-default-500">
                  {order.date}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="primary"
                    aria-label="View order"
                  >
                    <Icon icon="solar:eye-linear" width={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="primary"
                    aria-label="Track order"
                  >
                    <Icon icon="solar:routing-2-linear" width={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
