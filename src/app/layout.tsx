import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/components/auth-provider";

// Set the theme class before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicPulse — Report. Track. Resolve.",
  description:
    "CivicPulse is a hyperlocal civic issue platform. Report potholes, leaks, broken streetlights and waste with a photo — AI triages, the community verifies, and you track it to resolution.",
  applicationName: "CivicPulse",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </AuthProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--color-bg)",
              color: "var(--color-fg)",
              border: "1px solid var(--color-border)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
