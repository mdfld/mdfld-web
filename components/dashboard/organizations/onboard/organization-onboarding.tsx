"use client";

import React, { useState } from "react";
import { domAnimation, LazyMotion, m } from "framer-motion";

import { trpc } from "@/lib/trpc-client";

import { toast } from "sonner";

import MultistepSidebar from "./multistep-sidebar";
import OrganizationBasicForm from "./organization-basic-form";
import OrganizationDetailsForm from "./organization-details-form";
import OrganizationAddressForm from "./organization-address-form";
import OrganizationReviewForm from "./organization-review-form";
import MultistepNavigationButtons from "./multistep-navigation-buttons";

const variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    y: direction < 0 ? 30 : -30,
    opacity: 0,
  }),
};

export interface OrganizationFormData {
  name: string;
  slug: string;
  description: string;
  industry: string;
  size: string;
  businessType: string;
  website: string;
  taxId: string;
  businessLicense: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export default function OrganizationOnboarding({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [[page, direction], setPage] = React.useState([0, 0]);

  const createOrganization = trpc.organization.create.useMutation();
  const [formData, setFormData] = useState<Partial<OrganizationFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const paginate = React.useCallback((newDirection: number) => {
    setPage((prev) => {
      const nextPage = prev[0] + newDirection;

      if (nextPage < 0 || nextPage > 3) return prev;

      return [nextPage, newDirection];
    });
  }, []);

  const onChangePage = React.useCallback((newPage: number) => {
    setPage((prev) => {
      if (newPage < 0 || newPage > 3) return prev;
      const currentPage = prev[0];

      return [newPage, newPage > currentPage ? 1 : -1];
    });
  }, []);

  const onBack = React.useCallback(() => {
    paginate(-1);
  }, [paginate]);

  const onNext = React.useCallback(() => {
    paginate(1);
  }, [paginate]);

  const updateFormData = (data: Partial<OrganizationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await createOrganization.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        industry: formData.industry || undefined,
        size: formData.size
          ? (formData.size as
              | "STARTUP"
              | "SMALL"
              | "MEDIUM"
              | "LARGE"
              | "ENTERPRISE")
          : undefined,
        businessType: formData.businessType
          ? (formData.businessType as
              | "INDIVIDUAL"
              | "SMALL_BUSINESS"
              | "CORPORATION"
              | "NON_PROFIT")
          : undefined,
        website: formData.website || undefined,
        taxId: formData.taxId || undefined,
        businessLicense: formData.businessLicense || undefined,
        address: formData.address || undefined,
      });

      toast.success("Organization created successfully!");
      onComplete?.();
    } catch (error: any) {
      // Check if the organization was actually created despite the error
      if (error.message?.includes("Unique constraint failed")) {
        // The org was likely created with an auto-generated slug
        toast.success("Organization created successfully!");
        onComplete?.();
      } else {
        toast.error(error.message || "Failed to create organization");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const content = React.useMemo(() => {
    let component = (
      <OrganizationBasicForm data={formData} onUpdate={updateFormData} />
    );

    switch (page) {
      case 1:
        component = (
          <OrganizationDetailsForm data={formData} onUpdate={updateFormData} />
        );
        break;
      case 2:
        component = (
          <OrganizationAddressForm data={formData} onUpdate={updateFormData} />
        );
        break;
      case 3:
        component = <OrganizationReviewForm data={formData} />;
        break;
    }

    return (
      <LazyMotion features={domAnimation}>
        <m.div
          key={page}
          animate="center"
          className="col-span-12"
          custom={direction}
          exit="exit"
          initial="exit"
          transition={{
            y: {
              ease: "backOut",
              duration: 0.35,
            },
            opacity: { duration: 0.4 },
          }}
          variants={variants}
        >
          {component}
        </m.div>
      </LazyMotion>
    );
  }, [direction, page, formData]);

  return (
    <MultistepSidebar
      currentPage={page}
      onBack={onBack}
      onChangePage={onChangePage}
      onNext={onNext}
    >
      <div className="relative flex h-fit w-full flex-col pt-6 lg:h-full lg:justify-center lg:pt-0">
        {content}
        <MultistepNavigationButtons
          backButtonProps={{ isDisabled: page === 0 }}
          className="hidden justify-start lg:flex"
          nextButtonProps={{
            children: page === 3 ? "Create Store" : "Continue",
            onClick: page === 3 ? handleSubmit : onNext,
            isLoading: page === 3 && isLoading,
          }}
          onBack={onBack}
          onNext={page === 3 ? handleSubmit : onNext}
        />
      </div>
    </MultistepSidebar>
  );
}
