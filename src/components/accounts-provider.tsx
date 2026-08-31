"use client";

import { createContext, useContext, type ReactNode } from "react";

const AccountsContext = createContext(false);

export function AccountsProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <AccountsContext.Provider value={enabled}>{children}</AccountsContext.Provider>;
}

export function useAccountsEnabled(): boolean {
  return useContext(AccountsContext);
}
