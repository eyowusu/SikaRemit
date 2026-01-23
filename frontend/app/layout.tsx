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

            <footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', position: 'relative', zIndex: 10 }}>
              <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'linear-gradient(to right, #9333ea, #ec4899)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src="/logos/SikaRemit.jpeg" alt="SikaRemit" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '8px' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>SikaRemit</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Secure Payment Solutions</div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', maxWidth: '400px' }}>
                  Empowering businesses worldwide with secure, fast, and reliable payment processing solutions.
                </p>

                {/* Links - 2x2 grid on mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', marginBottom: '12px' }}>Product</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                      <Link href="#features">Features</Link>
                      <Link href="#pricing">Pricing</Link>
                      <Link href="#security">Security</Link>
                      <Link href="/api">API Docs</Link>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', marginBottom: '12px' }}>Support</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                      <Link href="/faq">FAQ</Link>
                      <Link href="/contact">Contact</Link>
                      <Link href="/help">Help Center</Link>
                      <Link href="/status">Status</Link>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', marginBottom: '12px' }}>Company</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                      <Link href="/about">About</Link>
                      <Link href="/careers">Careers</Link>
                      <Link href="/blog">Blog</Link>
                      <Link href="/press">Press</Link>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937', marginBottom: '12px' }}>Legal</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                      <Link href="/privacy">Privacy</Link>
                      <Link href="/terms">Terms</Link>
                      <Link href="/compliance">Compliance</Link>
                      <Link href="/cookies">Cookies</Link>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: '#e5e7eb', marginBottom: '16px' }}></div>

                {/* Copyright */}
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                  © 2025 SikaRemit. All rights reserved. Powered by PayGlobe
                </div>
              </div>
            </footer>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  )
}
