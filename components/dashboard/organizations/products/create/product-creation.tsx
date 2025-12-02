"use client";

import React, { useState } from "react";
import { domAnimation, LazyMotion, m } from "framer-motion";

import { trpc } from "@/lib/trpc-client";

import { toast } from "sonner";

import MultistepSidebar from "./multistep-sidebar";
import ProductBasicForm from "./product-basic-form";
import ProductDetailsForm from "./product-details-form";
import ProductPricingForm from "./product-pricing-form";
import ProductReviewForm from "./product-review-form";
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

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  condition: string;
  images: string[];
  price: number;
  quantity: number;
  sku: string;
  brand: string;
  model: string;
  size: string;
  color: string;
  material: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
}

export default function ProductCreation({
  organizationId,
  sellerProfileId,
  onComplete,
  onClose,
}: {
  organizationId: string;
  sellerProfileId: string;
  onComplete?: () => void;
  onClose?: () => void;
}) {
  const [[page, direction], setPage] = React.useState([0, 0]);

  const createProduct = trpc.product.create.useMutation();
  const [formData, setFormData] = useState<Partial<ProductFormData>>({});
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

  const updateFormData = (data: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.price ||
      !formData.quantity ||
      !formData.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await createProduct.mutateAsync({
        sellerProfileId,
        organizationId,
        title: formData.name,
        description: formData.description!,
        category: formData.category || "OTHER",
        condition:
          (formData.condition as
            | "BRAND_NEW"
            | "NEW_WITH_TAGS"
            | "NEW_WITHOUT_TAGS"
            | "USED_LIKE_NEW"
            | "USED_GOOD"
            | "USED_FAIR") || "BRAND_NEW",
        images: formData.images || [],
        price: formData.price,
        inventory: formData.quantity || 0,
        sku: formData.sku || undefined,
        brand: formData.brand,
        material: formData.material,
        weight: formData.weight,
        dimensions: formData.dimensions,
        tags: formData.tags || [],
        isActive: true,
      });

      toast.success("Product created successfully!");
      onComplete?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  const content = React.useMemo(() => {
    let component = (
      <ProductBasicForm data={formData} onUpdate={updateFormData} />
    );

    switch (page) {
      case 1:
        component = (
          <ProductDetailsForm data={formData} onUpdate={updateFormData} />
        );
        break;
      case 2:
        component = (
          <ProductPricingForm data={formData} onUpdate={updateFormData} />
        );
        break;
      case 3:
        component = <ProductReviewForm data={formData} />;
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
      onClose={onClose}
    >
      <div className="relative flex h-fit w-full flex-col pt-6 lg:h-full lg:justify-center lg:pt-0">
        {content}
        <MultistepNavigationButtons
          backButtonProps={{ isDisabled: page === 0 }}
          className="hidden justify-start lg:flex"
          nextButtonProps={{
            children: page === 3 ? "Create Product" : "Continue",
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
