"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ShopFilterPanelContextValue = {
  isFilterOpen: boolean;
  openFilterPanel: () => void;
  closeFilterPanel: () => void;
  toggleFilterPanel: () => void;
};

const ShopFilterPanelContext = createContext<ShopFilterPanelContextValue | null>(
  null,
);

export function ShopFilterPanelProvider({ children }: { children: ReactNode }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const openFilterPanel = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const closeFilterPanel = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterOpen((open) => !open);
  }, []);

  return (
    <ShopFilterPanelContext.Provider
      value={{
        isFilterOpen,
        openFilterPanel,
        closeFilterPanel,
        toggleFilterPanel,
      }}
    >
      {children}
    </ShopFilterPanelContext.Provider>
  );
}

export function useShopFilterPanel(): ShopFilterPanelContextValue {
  const ctx = useContext(ShopFilterPanelContext);
  if (!ctx) {
    throw new Error("useShopFilterPanel must be used within ShopFilterPanelProvider");
  }
  return ctx;
}
