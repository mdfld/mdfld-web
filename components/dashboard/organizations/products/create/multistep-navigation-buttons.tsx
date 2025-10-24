import type { ButtonProps } from "@heroui/react";

import * as React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

type MultistepNavigationButtonsProps = React.HTMLAttributes<HTMLDivElement> & {
  onBack?: () => void;
  onNext?: () => void;
  backButtonProps?: ButtonProps;
  nextButtonProps?: ButtonProps;
};

const MultistepNavigationButtons = React.forwardRef<
  HTMLDivElement,
  MultistepNavigationButtonsProps
>(
  (
    { className, onBack, onNext, backButtonProps, nextButtonProps, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "mx-auto my-6 flex w-full items-center justify-center gap-x-4 lg:mx-0",
        className,
      )}
      {...props}
    >
      <Button
        className="rounded-medium border-gray-700 text-medium text-gray-400 font-medium lg:hidden h-10 px-6"
        variant="bordered"
        onPress={onBack}
        {...backButtonProps}
      >
        <Icon icon="solar:arrow-left-outline" width={20} />
        Go Back
      </Button>

      <div className="relative inline-flex">
        <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-600 via-primary-500 to-blue-400 rounded-medium" />
        <Button
          className="relative text-medium font-medium bg-zinc-950 h-10 px-8 min-w-[160px] hover:bg-zinc-900 transition-colors rounded-medium"
          color="primary"
          variant="flat"
          type="submit"
          onPress={onNext}
          {...nextButtonProps}
        >
          {nextButtonProps?.children || "Continue"}
        </Button>
      </div>
    </div>
  ),
);

MultistepNavigationButtons.displayName = "MultistepNavigationButtons";

export default MultistepNavigationButtons;
