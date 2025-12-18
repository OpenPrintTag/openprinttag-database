import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => (
  <div className="space-y-2">
    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
    {description && <p className="text-gray-600">{description}</p>}
  </div>
);
