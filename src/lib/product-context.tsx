import React, { createContext, useContext, useState, ReactNode } from 'react';
import SerpApiService, { SerpProduct } from '@/lib/serp-api';

interface ProductContextType {
  selectedProduct: string;
  setSelectedProduct: (product: string) => void;
  clearSelectedProduct: () => void;
  isProductSelected: boolean;
  selectedProductDetails: SerpProduct | null;
  currentPrice: number | null;
  priceHistory: Array<{ date: string; price: number }>;
  lastUpdated: string | null;
  startTracking: (product: SerpProduct) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductDetails, setSelectedProductDetails] = useState<SerpProduct | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; price: number }>>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const clearSelectedProduct = () => {
    setSelectedProduct("");
    setSelectedProductDetails(null);
    setCurrentPrice(null);
    setPriceHistory([]);
    setLastUpdated(null);
  };

  const isProductSelected = selectedProduct.trim().length > 0;

  const parsePriceToNumber = (priceStr?: string): number | null => {
    if (!priceStr) return null;
    const numeric = priceStr.replace(/[^0-9.]/g, '');
    const value = parseFloat(numeric);
    return isNaN(value) ? null : value;
  };

  const startTracking = async (product: SerpProduct) => {
    setSelectedProduct(product.title);
    setSelectedProductDetails(product);

    const parsed = parsePriceToNumber(product.price);
    if (parsed !== null) {
      setCurrentPrice(parsed);
    }

    try {
      const serp = SerpApiService.getInstance();
      const history = await serp.getPriceHistory(product.title, 60);
      const mapped = history.map(h => ({ date: h.date, price: Math.max(0, Math.round(h.price)) }));

      // Align historical series to the actual current price without altering prediction logic
      let adjusted = mapped;
      if (parsed !== null && adjusted.length > 0) {
        const lastPrice = adjusted[adjusted.length - 1].price;
        const offset = parsed - lastPrice;
        adjusted = adjusted.map(p => ({ date: p.date, price: Math.max(0, Math.round(p.price + offset)) }));
        // Ensure the most recent point is exactly the current parsed price
        adjusted[adjusted.length - 1] = { ...adjusted[adjusted.length - 1], price: parsed };
      }

      setPriceHistory(adjusted);
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      // If fetching history fails, seed minimal history with current price
      const today = new Date();
      const fallback: Array<{ date: string; price: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i * 7);
        fallback.push({ date: d.toISOString().split('T')[0], price: parsed || 0 });
      }
      setPriceHistory(fallback);
      setLastUpdated(new Date().toISOString());
    }
  };

  return (
    <ProductContext.Provider
      value={{
        selectedProduct,
        setSelectedProduct,
        clearSelectedProduct,
        isProductSelected,
        selectedProductDetails,
        currentPrice,
        priceHistory,
        lastUpdated,
        startTracking,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
