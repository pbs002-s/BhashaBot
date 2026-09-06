import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "@fontsource-variable/outfit";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";
import { AUTHOR } from "@/lib/settings-schema";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BhashaBot — multilingual reply desk",
  description:
    "A multilingual reply desk for Messenger, Instagram, WhatsApp, Telegram, Discord and Slack. Ten moods, each with its own page, on a free API key.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  openGraph: {
    title: "BhashaBot",
    description:
      "One inbox, every language, ten moods. Messenger, Instagram, WhatsApp, Telegram, Discord and Slack, on your own free API key.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3ED" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0C0B" },
  ],
};

/**
 * Runs before first paint so a dark-theme reader never sees a white flash.
 * Kept inline and dependency-free on purpose.
 */
const themeBootstrap = `(function(){try{
  var t=localStorage.getItem('bhashabot.theme')||'system';
  var dark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  var r=document.documentElement;
  r.classList.toggle('dark',dark);
  r.dataset.theme=dark?'dark':'light';
  var c=localStorage.getItem('bhashabot.color')||'saffron';
  r.dataset.color=c;
  var l=localStorage.getItem('bhashabot.locale');
  if(l==='bn'||l==='en')r.lang=l;
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hindSiliguri.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-[100dvh] bg-ink font-body text-paper">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
