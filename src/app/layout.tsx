import type { Metadata } from "next";
import type { ReactNode } from "react";
import { messages } from "@/ui/messages";
import "./globals.css";

export const metadata: Metadata = {
  title: messages.heading,
  description: messages.pageDescription,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
