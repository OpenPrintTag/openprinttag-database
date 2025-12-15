import React from 'react';

export const FormField = ({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <label htmlFor={htmlFor} className="block space-y-1">
      <div className="text-xs tracking-wide text-gray-600 uppercase">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </div>
      <div>{children}</div>
    </label>
  );
};
