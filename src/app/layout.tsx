import { Wordmark } from "@/components/ui";
import { brand, chromeCopy } from "@/lib/ui-copy";
import "./styles.css";

export const metadata = {
  title: brand.name,
  description: "End-to-end encrypted one-time secret sharing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          {brand.skip}
        </a>
        <div className="app">
          <header className="topbar">
            <Wordmark />
          </header>
          {children}
          <footer className="footer">
            <p>{chromeCopy.footer}</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
