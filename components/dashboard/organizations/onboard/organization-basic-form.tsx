"use client";

import type { InputProps } from "@heroui/react";
import React, { useEffect } from "react";
import { Input, Textarea } from "@heroui/react";
import { cn } from "@heroui/react";
import { trpc } from "@/lib/trpc-client";
import type { OrganizationFormData } from "./organization-onboarding";

export type OrganizationBasicFormProps = {
  data: Partial<OrganizationFormData>;
  onUpdate: (data: Partial<OrganizationFormData>) => void;
} & React.HTMLAttributes<HTMLFormElement>;

const OrganizationBasicForm = React.forwardRef<
  HTMLFormElement,
  OrganizationBasicFormProps
>(({ className, data, onUpdate, ...props }, ref) => {
  const [slug, setSlug] = React.useState(data.slug || "");
  const [name, setName] = React.useState(data.name || "");
  const [description, setDescription] = React.useState(data.description || "");

  const { data: slugCheck } = trpc.organization.checkSlugAvailability.useQuery(
    { slug },
    { enabled: slug.length > 2 },
  );

  const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug if slug is empty or matches previously generated slug
    const newSlug = generateSlugFromName(value);
    if (!data.slug || slug === generateSlugFromName(data.name || "")) {
      setSlug(newSlug);
    }
  };

  useEffect(() => {
    onUpdate({
      name,
      slug,
      description,
    });
  }, [name, slug, description]);

  return (
    <>
      <div className="text-default-foreground text-3xl leading-9 font-bold">
        Create Your Organization
      </div>
      <div className="text-medium text-default-500 py-2">
        Let's start with some basic information about your organization
      </div>
      <form
        ref={ref}
        {...props}
        className={cn("flex grid grid-cols-12 flex-col gap-4 py-8", className)}
      >
        <Input
          className="col-span-12"
          label="Organization Name"
          name="name"
          placeholder="Acme Corporation"
          value={name}
          onValueChange={handleNameChange}
          isRequired
          {...inputProps}
        />

        <Input
          className="col-span-12"
          label="Organization Slug"
          name="slug"
          placeholder="acme-corp"
          value={slug}
          onValueChange={setSlug}
          isRequired
          description="This will be used in your organization's URL"
          errorMessage={
            slug.length > 2 && slugCheck && !slugCheck.available
              ? "This slug is already taken"
              : undefined
          }
          color={
            slug.length > 2 && slugCheck
              ? slugCheck.available
                ? "success"
                : "danger"
              : "default"
          }
          {...inputProps}
        />

        <Textarea
          className="col-span-12"
          label="Description"
          name="description"
          placeholder="Tell us about your organization..."
          value={description}
          onValueChange={setDescription}
          minRows={3}
          labelPlacement="outside"
          classNames={{
            label:
              "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
          }}
        />
      </form>
    </>
  );
});

OrganizationBasicForm.displayName = "OrganizationBasicForm";

export default OrganizationBasicForm;
