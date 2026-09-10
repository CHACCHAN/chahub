import { useId, type ComponentProps } from "react";
import { Field, fieldClassName, type FieldProps } from "./input";

export function Select({ label, wrapperClassName, id: givenId, className = "", ...props }: ComponentProps<"select"> & FieldProps) {
  const generated = useId();
  const id = givenId ?? generated;
  return <Field id={id} label={label} wrapperClassName={wrapperClassName}>
    <select {...props} id={id} className={`${fieldClassName} ${label != null ? "w-full" : ""} ${className}`} />
  </Field>;
}
