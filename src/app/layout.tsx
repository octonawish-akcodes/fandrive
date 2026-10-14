import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo-black" });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "FanDrive · Every fandom is a blood drive waiting to happen",
  description: "An AI agent that uses Qloo taste data to find which fandoms skew young in your city, where those fans live, and which venues nearby can host a blood drive.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-black">{children}</body>
    </html>
  );
}
