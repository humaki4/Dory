import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/classNames";
import styles from "./Badge.module.css";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "info" | "success" | "warning";
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn(styles.badge, tone !== "neutral" && styles[tone], className)} {...props} />;
}
