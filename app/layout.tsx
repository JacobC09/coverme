import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PwaRegistrar } from "@/components/pwa-registrar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    applicationName: "CoverMe",
    title: "CoverMe",
    description: "Offer and claim Town of Oakville pool shifts.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "CoverMe",
    },
    icons: {
        apple: "/apple-touch-icon.png",
        icon: [
            { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
    },
};

export const viewport: Viewport = {
    themeColor: "#12343b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={cn(
                "h-full",
                "antialiased",
                geistSans.variable,
                geistMono.variable,
                "font-sans",
                inter.variable,
            )}>
            <body className="bg-background min-h-full flex flex-col max-w-2xl mx-auto overflow-x-hidden px-6 sm:px-10 pt-8 sm:pt-10 pb-[15vh] text-zinc-950">
                <PwaRegistrar />
                {children}
            </body>
        </html>
    );
}
