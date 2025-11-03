'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, CreditCard, Users, BarChart3, Smartphone, Globe, Menu, X, ArrowRight, CheckCircle, Star, TrendingUp, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Transactions', value: '$2.5B+', icon: TrendingUp },
    { label: 'Countries', value: '120+', icon: Globe },
    { label: 'Uptime', value: '99.9%', icon: Zap }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CEO, TechFlow Inc.',
      content: 'PayGlobe transformed our payment processing. The security and speed are unmatched.',
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
      content: 'Cross-border payments were a nightmare. PayGlobe made it seamless.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-payglobe-card">
      {/* Navigation */}
      <nav className={`border-b border-payglobe-border bg-payglobe-card/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-9 h-9 bg-payglobe-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Globe className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="absolute -inset-1 bg-payglobe-primary/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <span className="text-xl font-bold text-payglobe-foreground">
                  PayGlobe
                </span>
                <div className="text-xs text-payglobe-muted -mt-1">Financial Technology</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="#features" className="text-payglobe-muted hover:text-payglobe-foreground font-medium transition-colors duration-200 relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-payglobe-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#pricing" className="text-payglobe-muted hover:text-payglobe-foreground font-medium transition-colors duration-200 relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-payglobe-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#about" className="text-payglobe-muted hover:text-payglobe-foreground font-medium transition-colors duration-200 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-payglobe-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/contact" className="text-payglobe-muted hover:text-payglobe-foreground font-medium transition-colors duration-200 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-payglobe-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link href="/auth">
                <Button variant="ghost" className="font-medium hover:bg-payglobe-accent transition-colors duration-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth?mode=register">
                <Button className="bg-payglobe-primary hover:bg-payglobe-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="py-4 space-y-4">
              <Link href="#features" className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200">
                Features
              </Link>
              <Link href="#pricing" className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200">
                Pricing
              </Link>
              <Link href="#about" className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200">
                About
              </Link>
              <Link href="/contact" className="block px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200">
                Contact
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Link href="/auth">
                  <Button variant="ghost" className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth?mode=register">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5"></div>
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-payglobe-accent text-payglobe-foreground text-sm font-medium mb-8">
              <Zap className="w-4 h-4 mr-2" />
              Next-Generation Payment Solutions
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-payglobe-foreground mb-6">
              Secure Payments for the
              <span className="text-payglobe-primary"> Digital Age</span>
            </h1>
            <p className="text-xl text-payglobe-muted mb-8 max-w-2xl mx-auto">
              Experience seamless, secure payment processing with PayGlobe. Built for businesses that demand reliability, speed, and global reach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=register">
                <Button size="lg" className="bg-payglobe-primary hover:bg-payglobe-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 font-medium">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="border-payglobe-border hover:bg-payglobe-accent">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-payglobe-primary" />
                <span className="text-payglobe-muted">No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-payglobe-primary" />
                <span className="text-payglobe-muted">30-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-payglobe-primary" />
                <span className="text-payglobe-muted">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-payglobe-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-payglobe-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-payglobe-card border-y border-payglobe-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className={`text-center transition-all duration-700 delay-${index * 100} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 bg-payglobe-primary/10 rounded-xl mb-4">
                  <stat.icon className="w-6 h-6 text-payglobe-primary" />
                </div>
                <div className="text-3xl font-bold text-payglobe-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-payglobe-muted font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-payglobe-accent/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Badge variant="outline" className="mb-4 border-payglobe-primary/20 text-payglobe-primary">
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-payglobe-foreground mb-6">
              Everything you need to
              <span className="text-payglobe-primary"> succeed</span>
            </h2>
            <p className="text-xl text-payglobe-muted max-w-3xl mx-auto leading-relaxed">
              Comprehensive payment solutions designed for modern businesses.
              Built for scale, security, and seamless user experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Bank-Level Security',
                description: 'Enterprise-grade encryption with PCI DSS compliance, fraud detection, and real-time monitoring.',
                color: 'bg-payglobe-primary/10 text-payglobe-primary'
              },
              {
                icon: CreditCard,
                title: 'Multiple Payment Methods',
                description: 'Accept cards, digital wallets, bank transfers, and mobile money across 120+ countries.',
                color: 'bg-payglobe-primary/10 text-payglobe-primary'
              },
              {
                icon: Smartphone,
                title: 'Mobile Money Integration',
                description: 'Seamless integration with leading mobile money providers for emerging markets.',
                color: 'bg-payglobe-primary/10 text-payglobe-primary'
              },
              {
                icon: Users,
                title: 'Merchant Management',
                description: 'Complete onboarding, verification, and payout management for your merchant network.',
                color: 'bg-payglobe-primary/10 text-payglobe-primary'
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Real-time insights, detailed reporting, and business intelligence dashboards.',
                color: 'bg-payglobe-primary/10 text-payglobe-primary'
              },
              {
                icon: Globe,
                title: 'Global Infrastructure',
                description: 'Multi-region deployment with 99.9% uptime and competitive cross-border rates.',
                color: 'bg-payglobe-primary/10 text-payglobe-primary'
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-payglobe-card/80 backdrop-blur-sm group cursor-pointer">
                <CardHeader className="pb-4">
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-xl font-bold text-payglobe-foreground group-hover:text-payglobe-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-payglobe-muted leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary">
              Customer Success
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Trusted by industry leaders
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how businesses are transforming their payment processes with PayGlobe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-card">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic leading-relaxed">
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

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className={`max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to transform your
              <br />
              <span className="text-accent-foreground">
                payment experience?
              </span>
            </h2>
            <p className="text-primary-foreground/80 mb-10 leading-relaxed">
              Join thousands of businesses already using PayGlobe to streamline their financial operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=register">
                <Button size="lg" variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-2xl font-semibold px-8 py-4 text-lg group">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm font-semibold px-8 py-4 text-lg">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-primary-foreground/60 mt-6 text-sm">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>
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
                  <span className="text-2xl font-bold text-foreground">PayGlobe</span>
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
              2025 PayGlobe. All rights reserved.
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
  )
}
