"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Switch,
  Button,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export default function AdminSettingsPage() {
  const settings = [
    {
      section: "User Management",
      icon: "solar:users-group-rounded-bold-duotone",
      items: [
        {
          id: "user-registration",
          label: "Allow new user registrations",
          description: "Enable or disable new user sign-ups",
          enabled: true,
        },
        {
          id: "email-verification",
          label: "Require email verification",
          description:
            "Users must verify their email before accessing the platform",
          enabled: true,
        },
        {
          id: "profile-moderation",
          label: "Moderate user profiles",
          description: "Review user profiles before they go live",
          enabled: false,
        },
      ],
    },
    {
      section: "Organization Settings",
      icon: "solar:buildings-bold-duotone",
      items: [
        {
          id: "org-creation",
          label: "Allow organization creation",
          description: "Users can create new organizations",
          enabled: true,
        },
        {
          id: "org-verification",
          label: "Require organization verification",
          description: "Organizations must be verified by admins",
          enabled: false,
        },
        {
          id: "org-limits",
          label: "Organization member limits",
          description: "Limit the number of members per organization",
          enabled: false,
        },
      ],
    },
    {
      section: "Content & Messaging",
      icon: "solar:chat-round-dots-bold-duotone",
      items: [
        {
          id: "message-encryption",
          label: "End-to-end encryption",
          description: "Encrypt all messages between users",
          enabled: true,
        },
        {
          id: "content-filtering",
          label: "Automatic content filtering",
          description: "Filter inappropriate content automatically",
          enabled: false,
        },
        {
          id: "file-uploads",
          label: "Allow file uploads",
          description: "Users can upload files in messages",
          enabled: true,
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Settings</h1>
        <p className="text-default-600">
          Configure platform-wide settings and features
        </p>
      </div>

      <div className="space-y-6">
        {settings.map((section) => (
          <Card key={section.section}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon icon={section.icon} width={24} className="text-primary" />
                <h3 className="text-lg font-semibold">{section.section}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {section.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-default-500">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        defaultSelected={item.enabled}
                        size="sm"
                        color="primary"
                      />
                    </div>
                    {index < section.items.length - 1 && (
                      <Divider className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="bordered">Reset to Defaults</Button>
        <Button color="primary">Save Changes</Button>
      </div>
    </div>
  );
}
