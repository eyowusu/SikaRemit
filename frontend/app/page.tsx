'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Shield, CreditCard, Users, BarChart3, Smartphone, Globe, Menu, X, ArrowRight, CheckCircle, Star, TrendingUp, Zap } from 'lucide-react'
import { PhoneMockup } from '@/components/ui/phone-mockup'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Transactions', value: '2.5B+', icon: TrendingUp },
    { label: 'Countries', value: '120+', icon: Globe },
    { label: 'Uptime', value: '99.9%', icon: Zap }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CEO, TechFlow Inc.',
      content: 'SikaRemit transformed our payment processing. The security and speed are unmatched.',
      rating: 5
    },
    {
      name: 'Marcus Johnson',
      role: 'Founder, StartupHub',
      content: 'Finally, a payment solution that understands the needs of growing businesses.',
      rating: 5
    },
    {
      name: 'Elena Rodriguez',
      role: 'CFO, GlobalTrade Ltd.',
      content: 'Cross-border payments were a nightmare. SikaRemit made it seamless.',
      rating: 5
    }
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
          {/* Navigation - Revolut Style */}
          <nav className={`revolut-nav transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-revolut group-hover:shadow-revolut-lg transition-all duration-300 group-hover:scale-105">
                      <Globe className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-foreground">
                      SikaRemit
                    </span>
                    <div className="text-xs text-muted-foreground -mt-0.5">Financial Technology</div>
                  </div>
                </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link href="#features" className="revolut-nav-link relative group">
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="#pricing" className="revolut-nav-link relative group">
                  Pricing
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link href="#about" className="revolut-nav-link relative group">
                  About
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="revolut-nav-link relative group cursor-help">
                      Contact
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-card/95 backdrop-blur-xl border-border shadow-revolut-lg">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground">Get in Touch</h4>
                      <p className="text-sm text-muted-foreground">Reach out to our sales team or customer support for personalized assistance with your payment needs.</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>📧 support@sikaremit.com</p>
                        <p>📞 1-800-SIKAREMIT</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              {/* Mobile Navigation */}
              <div className={`lg:hidden absolute top-16 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 space-y-2">
                  <Link href="#features" className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200">
                    Features
                  </Link>
                  <Link href="#pricing" className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200">
                    Pricing
                  </Link>
                  <Link href="#about" className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200">
                    About
                  </Link>
                  <Link href="/contact" className="block px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200">
                    Contact
                  </Link>
                  <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                    <Link href="/auth">
                      <Button variant="ghost" className="w-full justify-center">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth">
                      <Button className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Auth Buttons */}
              <div className="hidden lg:flex items-center space-x-3">
                <Link href="/auth">
                  <Button variant="ghost" className="font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="font-medium group">
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors duration-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section - Revolut Style with Phone Mockup */}
        <section className="revolut-section relative overflow-hidden">
          <div className="absolute inset-0 bg-revolut-gradient-subtle opacity-50"></div>
          <div className="revolut-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left animate-fade-in">
                <div className="revolut-badge mb-8 animate-slide-in-from-top inline-flex">
                  <Zap className="w-4 h-4 mr-2" />
                  Next-Generation Payment Solutions
                </div>
                <h1 className="revolut-heading text-foreground mb-6 animate-slide-in-from-bottom">
                  Secure Payments for the
                  <span className="block text-revolut-gradient mt-2">Digital Age</span>
                </h1>
                <p className="revolut-subheading mb-10 animate-slide-in-from-bottom">
                  Experience seamless, secure payment processing with SikaRemit. Built for businesses that demand reliability, speed, and global reach.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-slide-in-from-bottom">
                  <Link href="/auth">
                    <Button size="lg" className="group">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" size="lg">
                      Learn More
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-in-from-bottom">
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">No setup fees</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">30-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Cancel anytime</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Phone Mockup */}
              <div className="hidden lg:flex justify-center lg:justify-end animate-slide-in-from-right">
                <PhoneMockup />
              </div>
            </div>
          </div>

          {/* Subtle Background Elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
        </section>

        {/* Stats Section - Revolut Style */}
        <section className="py-16 bg-card border-y border-border">
          <div className="revolut-container">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="revolut-stat hover-lift">
                  <div className="revolut-quick-action-icon mx-auto mb-4">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="revolut-stat-value">{stat.value}</div>
                  <div className="revolut-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* Testimonials Section - Revolut Style */}
      <section className="revolut-section bg-background">
        <div className="revolut-container">
          <div className="text-center mb-16">
            <div className="revolut-badge mb-4">
              Customer Success
            </div>
            <h2 className="revolut-heading text-foreground mb-6">
              Trusted by industry leaders
            </h2>
            <p className="revolut-subheading max-w-2xl mx-auto">
              See how businesses are transforming their payment processes with SikaRemit.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group hover-lift">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Revolut Style */}
      <section className="revolut-section relative overflow-hidden">
        <div className="absolute inset-0 bg-revolut-gradient"></div>
        <div className="revolut-container text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="revolut-heading text-white mb-6">
              Ready to transform your
              <br />
              payment experience?
            </h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Join thousands of businesses already using SikaRemit to streamline their financial operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 font-semibold group">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-white/60 mt-8 text-sm">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>
        {/* Subtle Background Elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-card-foreground py-16 border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">SikaRemit</span>
                  <div className="text-sm text-muted-foreground">Financial Technology Solutions</div>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Empowering businesses worldwide with secure, fast, and reliable payment processing solutions.
                Built for the future of digital commerce.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm">
                  <Globe className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <CreditCard className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Shield className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#security" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link href="/api" className="hover:text-foreground transition-colors">API Docs</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              2025 SikaRemit. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/compliance" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Compliance
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  )
}
