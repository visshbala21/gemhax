import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "Lemonade. — Song to Image",
  description:
    "Upload audio, get AI-generated artwork powered by Gemini",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${robotoMono.variable} font-mono bg-black text-gray-100 min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
