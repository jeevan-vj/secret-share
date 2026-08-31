import { AccountNav } from "@/components/account-nav";
import { AccountsProvider } from "@/components/accounts-provider";
import { Wordmark } from "@/components/ui";
import { accountsEnabled } from "@/lib/accounts";
import { brand, chromeCopy } from "@/lib/ui-copy";
import "./styles.css";

export const metadata = {
  title: brand.name,
  description: "End-to-end encrypted one-time secret sharing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const showAccounts = accountsEnabled();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          {brand.skip}
        </a>
        <div className="app">
          <AccountsProvider enabled={showAccounts}>
            <header className="topbar">
              <Wordmark />
              {showAccounts ? <AccountNav /> : null}
            </header>
            {children}
          </AccountsProvider>
          <footer className="footer">
            <p>{chromeCopy.footer}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
