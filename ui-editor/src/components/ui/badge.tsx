import React from 'react';

export const Badge = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 ring-1 ring-gray-200 ring-inset">
      {children}
    </span>
  );
};
