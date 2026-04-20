import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30",
  {
    variants: {
      variant: {
        default: "border-transparent bg-sky-600/90 text-white",
        secondary: "border-white/10 bg-white/5 text-slate-200",
        outline: "border-white/10 text-slate-300",
        hot: "border-amber-400/30 bg-amber-500/15 text-amber-100",
        warm: "border-sky-400/25 bg-sky-500/15 text-sky-100",
        cold: "border-slate-500/30 bg-slate-600/20 text-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
