"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

import RowSteps from "./row-steps";
import MultistepNavigationButtons from "./multistep-navigation-buttons";
import VerticalSteps from "./vertical-steps";

export type MultiStepSidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  currentPage: number;
  onBack: () => void;
  onNext: () => void;
  onChangePage: (page: number) => void;
};

const stepperClasses = cn(
  // light
  "[--step-color:hsl(var(--heroui-primary-400))]",
  "[--active-color:hsl(var(--heroui-primary-500))]",
  "[--inactive-border-color:hsl(var(--heroui-default-200))]",
  "[--inactive-bar-color:hsl(var(--heroui-default-200))]",
  "[--inactive-color:hsl(var(--heroui-default-300))]",
  // dark
  "dark:[--step-color:hsl(var(--heroui-primary-400))]",
  "dark:[--active-color:hsl(var(--heroui-primary-500))]",
  "dark:[--active-border-color:hsl(var(--heroui-primary-400))]",
  "dark:[--inactive-border-color:rgba(255,255,255,0.1)]",
  "dark:[--inactive-bar-color:rgba(255,255,255,0.1)]",
  "dark:[--inactive-color:rgba(255,255,255,0.2)]",
);

const MultiStepSidebar = React.forwardRef<
  HTMLDivElement,
  MultiStepSidebarProps
>(
  (
    {
      children,
      className,
      currentPage,
      onBack,
      onNext,
      onChangePage,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-[calc(100vh-40px)] w-full gap-x-2 border border-zinc-800/50 rounded-2xl overflow-hidden",
          className,
        )}
        {...props}
      >
        <div className="bg-zinc-950 shadow-small flex hidden h-full w-[344px] shrink-0 flex-col items-start gap-y-8 px-8 py-6 lg:flex">
          <Button
            className="bg-zinc-900 text-small text-zinc-400 font-medium border border-zinc-800"
            isDisabled={currentPage === 0}
            radius="full"
            variant="flat"
            onPress={onBack}
          >
            <Icon icon="solar:arrow-left-outline" width={18} />
            Back
          </Button>
          <div>
            <div className="text-default-foreground text-xl leading-7 font-medium">
              Create Store
            </div>
            <div className="text-default-500 mt-1 text-base leading-6 font-medium">
              Set up your organization in a few steps
            </div>
          </div>
          {/* Desktop Steps */}
          <VerticalSteps
            className={stepperClasses}
            color="primary"
            currentStep={currentPage}
            steps={[
              {
                title: "Basic Information",
                description: "Name and description",
              },
              {
                title: "Company Details",
                description: "Business type and industry",
              },
              {
                title: "Business Address",
                description: "Your official location",
              },
              {
                title: "Review & Create",
                description: "Confirm your details",
              },
            ]}
            onStepChange={onChangePage}
          />
        </div>
        <div className="flex h-full w-full flex-col items-center gap-4 md:p-4 bg-zinc-900">
          <div className="rounded-large bg-zinc-800 shadow-small sticky top-0 z-10 w-full py-4 md:max-w-xl lg:hidden">
            <div className="flex justify-center">
              {/* Mobile Steps */}
              <RowSteps
                className={cn("pl-6", stepperClasses)}
                currentStep={currentPage}
                steps={[
                  {
                    title: "Basic Info",
                  },
                  {
                    title: "Details",
                  },
                  {
                    title: "Address",
                  },
                  {
                    title: "Review",
                  },
                ]}
                onStepChange={onChangePage}
              />
            </div>
          </div>
          <div className="h-full w-full p-4 sm:max-w-md md:max-w-lg">
            {children}
            <MultistepNavigationButtons
              backButtonProps={{ isDisabled: currentPage === 0 }}
              className="lg:hidden"
              nextButtonProps={{
                children: currentPage === 3 ? "Create Store" : "Continue",
              }}
              onBack={onBack}
              onNext={onNext}
            />
          </div>
        </div>
      </div>
    );
  },
);

MultiStepSidebar.displayName = "MultiStepSidebar";

export default MultiStepSidebar;
