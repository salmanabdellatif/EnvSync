import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { getCurrentUser } from "@/actions/auth";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EnvSync",
  description:
    "Secure your environment variables with client-side AES-256-GCM encryption. Sync secrets across your team in under 100ms.",
  keywords: [
    "secrets management",
    "environment variables",
    "encryption",
    "envsync",
    "developer tools",
  ],
  authors: [{ name: "Salman Abdellatif" }],
  openGraph: {
    title: "EnvSync",
    description:
      "Secure your environment variables with client-side AES-256-GCM encryption.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} font-mono antialiased`}>
        <AuthProvider initialUser={user}>
          <main>{children}</main>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
