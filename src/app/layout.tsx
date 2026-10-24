import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono, Oswald } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-oswald" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: { default: "BeeMo", template: "%s · BeeMo" },
  description: "IoT monitoring for stingless beehives: live temperature, humidity and weight, harvest cycles and reports.",
};

export const viewport: Viewport = { themeColor: "#1e1c18" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${oswald.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
