'use client';

import { createContext, useContext } from 'react';

// Dark-only — light mode removed
interface Ctx { theme: 'dark'; toggleTheme: () => void; }
const ThemeContext = createContext<Ctx>({ theme: 'dark', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // No toggle needed — always dark
  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
