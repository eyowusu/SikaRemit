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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Globe, CreditCard, Shield } from 'lucide-react'

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

            <footer className="border-t border-gray-200 bg-gray-50 relative z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Logo Section */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-xl overflow-hidden">
                      <img src="/logos/SikaRemit.jpeg" alt="SikaRemit" className="w-8 h-8 object-cover rounded-lg" />
                    </div>
                    <div>
                      <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">SikaRemit</span>
                      <div className="text-sm text-muted-foreground">Secure Payment Solutions</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4 max-w-md leading-relaxed">
                    Empowering businesses worldwide with secure, fast, and reliable payment processing solutions.
                  </p>
                  <div className="flex space-x-3">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <CreditCard className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-3">Product</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="#features" className="hover:text-sikaremit-primary">Features</Link></li>
                      <li><Link href="#pricing" className="hover:text-sikaremit-primary">Pricing</Link></li>
                      <li><Link href="#security" className="hover:text-sikaremit-primary">Security</Link></li>
                      <li><Link href="/api" className="hover:text-sikaremit-primary">API Docs</Link></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-3">Support</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="/faq" className="hover:text-sikaremit-primary">FAQ</Link></li>
                      <li><Link href="/contact" className="hover:text-sikaremit-primary">Contact</Link></li>
                      <li><Link href="/help" className="hover:text-sikaremit-primary">Help Center</Link></li>
                      <li><Link href="/status" className="hover:text-sikaremit-primary">Status</Link></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-3">Company</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="/about" className="hover:text-sikaremit-primary">About</Link></li>
                      <li><Link href="/careers" className="hover:text-sikaremit-primary">Careers</Link></li>
                      <li><Link href="/blog" className="hover:text-sikaremit-primary">Blog</Link></li>
                      <li><Link href="/press" className="hover:text-sikaremit-primary">Press</Link></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-3">Legal</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><Link href="/privacy" className="hover:text-sikaremit-primary">Privacy</Link></li>
                      <li><Link href="/terms" className="hover:text-sikaremit-primary">Terms</Link></li>
                      <li><Link href="/compliance" className="hover:text-sikaremit-primary">Compliance</Link></li>
                      <li><Link href="/cookies" className="hover:text-sikaremit-primary">Cookies</Link></li>
                    </ul>
                  </div>
                </div>

                <Separator className="mb-6 bg-gray-200" />

                {/* Copyright */}
                <div className="text-center text-xs sm:text-sm text-muted-foreground">
                  <p>© 2025 SikaRemit. All rights reserved. Powered by PayGlobe</p>
                </div>
              </div>
            </footer>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  )
}
