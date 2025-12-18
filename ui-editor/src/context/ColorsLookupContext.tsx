import React from 'react';

export type ColorItem = { uuid?: string; name?: string; rgba?: string };
export type ColorsById = Record<string, ColorItem>;

const ColorsLookupContext = React.createContext<ColorsById | null>(null);

export function useColorsLookup(): ColorsById | null {
  return React.useContext(ColorsLookupContext);
}
