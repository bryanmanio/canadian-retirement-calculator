import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Canadian Retirement Calculator",
  description: "Plan your Canadian retirement — OAS, CPP, RRSP, TFSA, tax-optimized. Free, private, no account required.",
  keywords: ["retirement calculator", "Canada", "OAS", "CPP", "RRSP", "TFSA"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}>
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}
