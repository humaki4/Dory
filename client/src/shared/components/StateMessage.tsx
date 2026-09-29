import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/classNames";
import styles from "./StateMessage.module.css";

interface StateMessageProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "neutral" | "loading" | "error";
}

export function StateMessage({
  className,
  tone = "neutral",
  role = tone === "error" ? "alert" : tone === "loading" ? "status" : undefined,
  ...props
}: StateMessageProps) {
  return (
    <div
      className={cn(styles.message, tone === "error" && styles.error, className)}
      role={role}
      {...props}
    />
  );
}
