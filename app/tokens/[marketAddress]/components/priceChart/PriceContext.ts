import { createContext, useContext } from 'react';

export interface PriceContextType {
  currentPrice: number | null;
  setCurrentPrice: (price: number) => void;
}

export const PriceContext = createContext<PriceContextType>({
  currentPrice: null,
  setCurrentPrice: () => {},
});

export const usePriceContext = () => useContext(PriceContext);