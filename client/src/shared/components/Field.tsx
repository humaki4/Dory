import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import styles from "./Field.module.css";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextField({ label, id, ...props }: TextFieldProps) {
  const controlId =
    id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className={styles.field} htmlFor={controlId}>
      <span className={styles.label}>{label}</span>
      <input id={controlId} className={styles.control} {...props} />
    </label>
  );
}

export function SelectField({
  label,
  id,
  children,
  ...props
}: SelectFieldProps) {
  const controlId =
    id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <label className={styles.field} htmlFor={controlId}>
      <span className={styles.label}>{label}</span>
      <select id={controlId} className={styles.control} {...props}>
        {children}
      </select>
    </label>
  );
}
