import type { Metadata } from "next";
import QaHooks from "@/components/dev/QaHooks";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { archivo, generalSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayodele Olayinka — Frontend Engineer",
  description:
    "Frontend engineer building interfaces that pay attention. React, Next.js, TypeScript.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} ${archivo.variable} antialiased`}
    >
      <body>
        {process.env.NODE_ENV !== "production" && <QaHooks />}
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
