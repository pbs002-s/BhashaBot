import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BhashaBot — Multilingual AI Auto-Reply & Agent Command Center",
  description:
    "Enterprise-ready multilingual Messenger AI support hub with real-time sentiment analysis, lead capture CRM, and instant Telegram human handoffs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`dark ${hindSiliguri.variable}`}>
      <body className="bg-ink text-paper font-body antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
