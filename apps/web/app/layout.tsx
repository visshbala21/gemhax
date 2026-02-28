import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gemhax — Audio to Art",
  description: "Upload audio, get AI-generated artwork powered by Gemini + Imagen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
