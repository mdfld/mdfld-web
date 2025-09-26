"use client";

import { Card, CardBody, CardHeader, Tabs, Tab, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function ModerationPage() {
  const moderationCategories = [
    {
      id: "content",
      label: "Content Review",
      icon: "solar:document-text-bold-duotone",
      count: 0,
    },
    {
      id: "users",
      label: "User Reports",
      icon: "solar:user-block-rounded-bold-duotone",
      count: 0,
    },
    {
      id: "messages",
      label: "Message Flags",
      icon: "solar:chat-square-call-bold-duotone",
      count: 0,
    },
    {
      id: "organizations",
      label: "Organization Review",
      icon: "solar:buildings-2-bold-duotone",
      count: 0,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-default-600">
          Review and moderate user-generated content and reports
        </p>
      </div>

      <Tabs aria-label="Moderation categories" color="primary" size="lg">
        {moderationCategories.map((category) => (
          <Tab
            key={category.id}
            title={
              <div className="flex items-center gap-2">
                <Icon icon={category.icon} width={20} />
                <span>{category.label}</span>
                {category.count > 0 && (
                  <Chip size="sm" color="danger">
                    {category.count}
                  </Chip>
                )}
              </div>
            }
          >
            <Card className="mt-4">
              <CardHeader>
                <h3 className="text-lg font-semibold">{category.label}</h3>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon
                    icon="solar:shield-check-bold-duotone"
                    width={64}
                    className="text-success mb-4"
                  />
                  <p className="text-lg font-medium mb-2">All Clear!</p>
                  <p className="text-default-500">
                    No {category.label.toLowerCase()} require moderation at this
                    time.
                  </p>
                </div>
              </CardBody>
            </Card>
          </Tab>
        ))}
      </Tabs>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Actions</h3>
          </CardHeader>
          <CardBody>
            <p className="text-default-500">No recent moderation actions</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Moderation Guidelines</h3>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-success mt-0.5"
                  width={16}
                />
                <span>Review flagged content within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-success mt-0.5"
                  width={16}
                />
                <span>Document all moderation actions</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-success mt-0.5"
                  width={16}
                />
                <span>Apply community guidelines consistently</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-success mt-0.5"
                  width={16}
                />
                <span>Escalate serious violations to admin team</span>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
