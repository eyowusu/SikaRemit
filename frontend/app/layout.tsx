import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'
import { EnhancedMainNav } from '@/components/EnhancedMainNav';
import { EnhancedErrorBoundary } from '@/components/EnhancedErrorBoundary'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { NotificationBell } from '@/components/ui/notification-bell'
import { UserMenu } from '@/components/UserMenu'
import { MobileMenu } from '@/components/MobileMenu'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Footer } from '@/components/Footer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SikaRemit - Secure Payment Solutions",
  description: "Experience seamless, secure payment processing with SikaRemit. Built for businesses that demand reliability, speed, and global reach.",
  keywords: "payments, fintech, money transfer, mobile money, bank transfers, secure payments",
  authors: [{ name: "SikaRemit Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/50 relative antialiased`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/8 to-purple-400/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-purple-500/3 via-transparent to-blue-500/3 rounded-full blur-2xl animate-spin" style={{animationDuration: '25s'}}></div>
        </div>
        <TooltipProvider>
          <Providers>
            <main className="flex-1">
              <EnhancedErrorBoundary>
                {children}
              </EnhancedErrorBoundary>
            </main>

            <Footer />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  )
}
