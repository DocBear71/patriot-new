import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from '@/components/providers/SessionProvider';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Patriot Thanks - Supporting Those Who Serve",
    description: "Find local businesses that offer discounts and incentives for military personnel, veterans, and first responders.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
            <html lang="en">
            <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
            <SessionProvider>
                {children}
            </SessionProvider>
            </body>
            </html>
    );
}