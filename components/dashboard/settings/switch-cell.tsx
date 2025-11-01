import { Switch } from "@heroui/react";
import React from "react";

export interface SwitchCellProps {
  label: string;
  description: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  classNames?: {
    base?: string;
  };
  color?: string;
}

const SwitchCell: React.FC<SwitchCellProps> = ({
  label,
  description,
  value = false,
  onValueChange,
  classNames,
  color,
}) => {
  return (
    <div
      className={`flex items-center justify-between py-4 ${classNames?.base || ""}`}
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="text-sm text-default-500">{description}</p>
      </div>
      <Switch
        isSelected={value}
        onValueChange={onValueChange}
        color={color as any}
      />
    </div>
  );
};

export default SwitchCell;
