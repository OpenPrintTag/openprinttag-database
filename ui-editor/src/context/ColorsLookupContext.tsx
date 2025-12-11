import React from 'react';

export type ColorItem = { uuid?: string; name?: string; rgba?: string };
export type ColorsById = Record<string, ColorItem>;

const ColorsLookupContext = React.createContext<ColorsById | null>(null);

export function ColorsLookupProvider({
  value,
  children,
}: {
  value: ColorsById | null;
  children: React.ReactNode;
}) {
  return (
    <ColorsLookupContext.Provider value={value}>
      {children}
    </ColorsLookupContext.Provider>
  );
}

export function useColorsLookup(): ColorsById | null {
  return React.useContext(ColorsLookupContext);
}
