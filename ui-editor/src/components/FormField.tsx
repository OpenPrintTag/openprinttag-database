import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}

export const FormField = ({
  label,
  htmlFor,
  required,
  children,
}: FormFieldProps) => (
  <label htmlFor={htmlFor} className="block space-y-1">
    <div className="text-xs tracking-wide text-gray-600 uppercase">
      {label} {required && <span className="text-red-600">*</span>}
    </div>
    <div>{children}</div>
  </label>
);
