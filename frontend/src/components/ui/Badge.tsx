import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        soft: "border-transparent bg-accent text-accent-foreground",
        "soft-success": "border-transparent bg-success/10 text-success",
        "soft-warning": "border-transparent bg-warning/10 text-warning",
        "soft-destructive": "border-transparent bg-destructive/10 text-destructive",
        violet: "border-transparent bg-violet text-violet-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
