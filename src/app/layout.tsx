import "./styles.css";

export const metadata = {
  title: "Secret Share",
  description: "End-to-end encrypted one-time secret sharing",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
