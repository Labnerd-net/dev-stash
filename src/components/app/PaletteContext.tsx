"use client";

import { createContext, useContext, useState } from "react";

interface PaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  function open() { setIsOpen(true); }
  function close() { setIsOpen(false); }

  return (
    <PaletteContext.Provider value={{ isOpen, open, close }}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used inside PaletteProvider");
  return ctx;
}
