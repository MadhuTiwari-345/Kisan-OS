"use client";

import { ReactNode } from "react";
import "./AnimatedGradientText.css";

interface AnimatedGradientTextProps {
  children: ReactNode;
  className?: string;
  withBorder?: boolean;
}

export function AnimatedGradientText({
  children,
  className = "",
  withBorder = false,
}: AnimatedGradientTextProps) {
  return (
    <div
      className={`animated-gradient-text ${withBorder ? "with-border" : ""} ${className}`}
    >
      {withBorder && <div className="gradient-overlay" />}
      <span className="text-content">{children}</span>
    </div>
  );
}
