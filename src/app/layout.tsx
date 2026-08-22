import type { Metadata } from "next";
import QaHooks from "@/components/dev/QaHooks";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayodele Olayinka",
  description: "Frontend engineer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {process.env.NODE_ENV !== "production" && <QaHooks />}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
