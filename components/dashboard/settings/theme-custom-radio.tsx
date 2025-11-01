import React from "react";
import { RadioProps, useRadio, VisuallyHidden } from "@heroui/react";
import { cn } from "@heroui/react";

export interface ThemeCustomRadioProps extends RadioProps {
  children: React.ReactNode;
}

export const ThemeCustomRadio: React.FC<ThemeCustomRadioProps> = (props) => {
  const {
    Component,
    children,
    isSelected,
    description,
    getBaseProps,
    getWrapperProps,
    getInputProps,
  } = useRadio(props);

  return (
    <Component
      {...getBaseProps()}
      className={cn(
        "group inline-flex m-0 hover:bg-content2 items-center justify-between flex-row-reverse",
        "max-w-full cursor-pointer border-2 border-default rounded-lg gap-4 p-4",
        "data-[selected=true]:border-primary",
      )}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <span {...getWrapperProps()}>
        <span
          className={cn(
            "w-2 h-2 rounded-full bg-white",
            isSelected && "bg-primary",
          )}
        />
      </span>
      <div className="w-full flex flex-col gap-1">{children}</div>
    </Component>
  );
};
