import type { Metadata } from "next";
import { Gowun_Dodum, Geist_Mono } from "next/font/google";
import { readSession } from "@/lib/auth/session";
import { parseTheme, parseThemeMode } from "@/lib/themes";
import "./globals.css";

const gowunDodum = Gowun_Dodum({
  variable: "--font-gowun-dodum",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "famList",
  description: "The family's shared lists and address book.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read straight from the session cookie (not verifySession/getCurrentUser)
  // since this layout also renders /login, where there's no user to look
  // up — readSession just returns null there, and parseTheme/parseThemeMode
  // fall back to eggplant/dark, today's original look.
  const session = await readSession();
  const theme = parseTheme(session?.theme);
  const themeMode = parseThemeMode(session?.themeMode);

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${gowunDodum.variable} ${geistMono.variable} ${themeMode === "dark" ? "dark" : ""} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
