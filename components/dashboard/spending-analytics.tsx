"use client";

import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export const SpendingAnalytics = () => {
  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Spending</h3>
          <Icon
            icon="solar:wallet-2-linear"
            width={20}
            className="text-default-400"
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold">$2,847</p>
            <p className="text-small text-default-500">This month</p>
          </div>

          <div className="flex items-center gap-2">
            <Icon
              icon="solar:arrow-up-linear"
              className="text-success"
              width={16}
            />
            <span className="text-small text-success">
              +22% from last month
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
