import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/classNames";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "small" | "medium";
}

export function Button({ className, type = "button", variant = "default", size = "medium", ...props }: ButtonProps) {
  return <button type={type} className={cn(styles.button, styles[variant], styles[size], className)} {...props} />;
}

interface IconButtonProps extends Omit<ButtonProps, "children"> {
  "aria-label": string;
  children: ReactNode;
}

export function IconButton({ className, ...props }: IconButtonProps) {
  return <Button variant="ghost" size="small" className={cn(styles.iconOnly, className)} {...props} />;
}
