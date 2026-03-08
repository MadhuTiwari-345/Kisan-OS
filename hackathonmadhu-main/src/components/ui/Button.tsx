import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-gradient-to-r from-[#33ccb3] via-[#85b944] to-[#d8f8b0] text-[#07211a] hover:brightness-105 active:brightness-95 shadow-[0_18px_50px_rgba(51,204,179,0.24)]":
              variant === "primary",
            "bg-white/8 text-white hover:bg-white/12 border border-white/10":
              variant === "secondary",
            "border border-white/18 text-white hover:bg-white/5 hover:border-[#d8f8b0]/35":
              variant === "outline",
            "text-white/60 hover:text-white hover:bg-white/5": variant === "ghost",
          },
          {
            "px-3.5 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-8 py-3.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
