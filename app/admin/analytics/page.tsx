"use client";

import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = trpc.admin.analytics.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <p className="text-default-500">Failed to load analytics data</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: analytics.users.total,
      icon: "solar:users-group-rounded-bold-duotone",
      color: "primary",
      subtitle: `+${analytics.users.recent} in last 30 days`,
    },
    {
      title: "Total Organizations",
      value: analytics.organizations.total,
      icon: "solar:buildings-bold-duotone",
      color: "secondary",
      subtitle: `+${analytics.organizations.recent} in last 30 days`,
    },
    {
      title: "Active Users",
      value: analytics.users.active,
      icon: "solar:user-check-rounded-bold-duotone",
      color: "success",
      subtitle: "Active in last 7 days",
    },
    {
      title: "Total Conversations",
      value: analytics.conversations.total,
      icon: "solar:chat-round-dots-bold-duotone",
      color: "warning",
      subtitle: "All-time conversations",
    },
    {
      title: "Total Messages",
      value: analytics.messages.total,
      icon: "solar:letter-bold-duotone",
      color: "danger",
      subtitle: "All-time messages",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Analytics</h1>
        <p className="text-default-600">
          Overview of platform usage and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-default-600">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-default-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`text-${stat.color}`}>
                  <Icon icon={stat.icon} width={32} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily User Registrations</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {analytics.dailyRegistrations.map((day: any) => (
              <div key={day.date} className="flex justify-between items-center">
                <span className="text-default-600">{day.date}</span>
                <span className="font-semibold">{day.count} new users</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
