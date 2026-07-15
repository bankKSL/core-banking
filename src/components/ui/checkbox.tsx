import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, id, indeterminate, ...props }, ref) => {
  const checkboxId = id || React.useId();

  const checkbox = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      data-state={indeterminate ? "indeterminate" : props.checked ? "checked" : "unchecked"}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D32F2F]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-[#D32F2F] data-[state=checked]:border-[#D32F2F] data-[state=checked]:text-white",
        "data-[state=indeterminate]:bg-[#D32F2F] data-[state=indeterminate]:border-[#D32F2F] data-[state=indeterminate]:text-white",
        "dark:border-gray-600 dark:ring-offset-gray-800 dark:data-[state=checked]:bg-[#D32F2F] dark:data-[state=checked]:border-[#D32F2F]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {indeterminate ? <Minus className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return checkbox;

  return (
    <div className="flex items-center gap-2">
      {checkbox}
      <label
        htmlFor={checkboxId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
