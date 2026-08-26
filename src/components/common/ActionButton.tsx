import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Ported from the Base44 app's src/components/common/ActionButton.jsx.
// The original also destructured an unused `to` prop (react-router link
// target) that no rendering branch ever read — dropped rather than carried
// forward as dead code.
const VARIANT_CLASSES = {
  primary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm",
  secondary: "bg-black hover:bg-gray-800 text-white",
  outline: "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50",
  outlineLight: "bg-transparent border border-white/30 text-white hover:bg-white/10",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  ghostLight: "bg-transparent text-white hover:text-orange-500 hover:bg-transparent",
} as const;

const SIZE_CLASSES = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-8 text-base",
} as const;

type ActionButtonProps = {
  icon?: ElementType;
  label?: ReactNode;
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  href?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Button>, "size" | "variant">;

export default function ActionButton({
  icon: Icon,
  label,
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: ActionButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );

  const content = (
    <>
      {Icon && <Icon className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5")} />}
      {label || children}
    </>
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Button className={classes} {...props}>
      {content}
    </Button>
  );
}

export function ActionGroup({
  children,
  className,
  align = "start",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "between";
}) {
  return (
    <div className={cn("flex flex-wrap gap-3", align === "center" && "justify-center", align === "between" && "justify-between", className)}>
      {children}
    </div>
  );
}
