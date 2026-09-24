import { type ReactNode, useEffect } from "react";
import { useLocation } from "react-router";
import { WalletProvider } from "@/components/wallet/wallet-provider";
import { AppMobileBar } from "./app-mobile-bar";
import { AppSidebar } from "./app-sidebar";
import { AppTopBar } from "./app-top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <WalletProvider>
      <div className="relative min-h-screen overflow-x-clip bg-canvas">
        <div className="sheen pointer-events-none fixed -inset-[20%]" aria-hidden />
        <div className="relative mx-auto flex max-w-[1560px] gap-7 p-4 lg:p-7">
          <AppSidebar />
          <main className="min-w-0 flex-1 lg:px-4 lg:pt-3">
            <AppMobileBar />
            <AppTopBar />
            {children}
          </main>
        </div>
      </div>
    </WalletProvider>
  );
}
