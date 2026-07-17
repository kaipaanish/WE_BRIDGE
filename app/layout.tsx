import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "WeBridge — schemes & funding for Indian founders",
  description:
    "Find, understand and act on the startup schemes, funding and support your Indian startup qualifies for.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      {/*
        suppressHydrationWarning: browser extensions commonly inject attributes
        into <body> before React hydrates, which React reports as a mismatch.
        This only silences attribute/text diffs on <body> itself — children are
        still checked normally, so real hydration bugs are not masked.
      */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
