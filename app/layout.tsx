import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FrameProvider } from "@/components/farcaster-provider";
import { BottomNavbar } from "@/components/BottomNavbar"; // Import here

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monad Frens Miniapp",
  description: "Trade wif frens on Monad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FrameProvider>
          <div className="pb-20">
            {children}
          </div>
          <BottomNavbar />
        </FrameProvider>
      </body>
    </html>
  );
}
