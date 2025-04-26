import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <div className="relative">
          <input
            type="checkbox"
            className="peer h-4 w-4 shrink-0 rounded-sm border border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
            ref={ref}
            {...props}
          />
          <Check className="absolute h-3 w-3 text-primary opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 pointer-events-none" />
        </div>
        {label && (
          <span className={cn("ml-2 text-sm text-muted-foreground", className)}>
            {label}
          </span>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox } 