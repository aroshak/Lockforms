import type { Metadata } from "next";
// AIR-GAP NOTE (Gap 6.3): `next/font/google` downloads fonts at BUILD TIME
// and self-hosts them — fonts are served from localhost at runtime (✅ air-gap safe).
// However, if building in a fully air-gapped environment (no internet at build time),
// this will fail. When preparing for air-gapped builds:
// TODO: Download Inter & Space Grotesk to `public/fonts/` and switch to `next/font/local`
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
    title: "LockForms.io",
    description: "Secure, Air-Gapped Form Builder",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-white`}>
                {children}
            </body>
        </html>
    );
}
