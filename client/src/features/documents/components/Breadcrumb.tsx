import * as React from "react";
import {
  Breadcrumbs as AriaBreadcrumbs,
  Breadcrumb as AriaBreadcrumb,
  type BreadcrumbsProps,
  type BreadcrumbProps,
} from "react-aria-components";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/shared/lib/classNames";
import styles from "./Breadcrumb.module.css";

interface BreadcrumbComponentProps<T> extends BreadcrumbsProps<T> {
  className?: string;
}

function Breadcrumb<T extends object>({
  className,
  ...props
}: BreadcrumbComponentProps<T>) {
  return (
    <AriaBreadcrumbs className={cn(styles.breadcrumbs, className)} {...props} />
  );
}

interface BreadcrumbItemProps extends BreadcrumbProps {
  className?: string;
}

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return <AriaBreadcrumb className={cn(styles.item, className)} {...props} />;
}

interface BreadcrumbLinkProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

function BreadcrumbLink({ className, ...props }: BreadcrumbLinkProps) {
  return <span className={cn(styles.link, className)} {...props} />;
}

interface BreadcrumbPageProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      aria-current="page"
      className={cn(styles.link, "[data-current]", className)}
      data-current="page"
      {...props}
    />
  );
}

interface BreadcrumbSeparatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn(styles.separator, className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </span>
  );
}

interface BreadcrumbEllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn(styles.ellipsis, className)}
      {...props}
    >
      <MoreHorizontal />
      <span className={styles.srOnly}>More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};

// Removed BreadcrumbList - React Aria handles list structure internally
