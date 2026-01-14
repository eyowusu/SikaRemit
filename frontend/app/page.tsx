'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Shield, CreditCard, Users, BarChart3, Smartphone, Globe, Menu, X, ArrowRight, CheckCircle, Star, TrendingUp, Zap, Lock, Sparkles, Globe2 } from 'lucide-react'
import { PhoneMockup } from '@/components/ui/phone-mockup'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Advanced encryption and fraud protection keep your transactions safe.',
      color: 'blue'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process payments in seconds, not days. Real-time settlement available.',
      color: 'yellow'
    },
    {
      icon: Globe2,
      title: 'Global Reach',
      description: 'Send money to over 120 countries with competitive exchange rates.',
      color: 'green'
    },
    {
      icon: Lock,
      title: 'Regulated & Licensed',
      description: 'Fully licensed financial institution with global regulatory compliance.',
      color: 'purple'
    }
  ]

  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users, description: 'Trusted worldwide' },
    { label: 'Transactions', value: '$2.5B+', icon: TrendingUp, description: 'Processed securely' },
    { label: 'Countries', value: '120+', icon: Globe, description: 'Global coverage' },
    { label: 'Success Rate', value: '99.9%', icon: Zap, description: 'Reliability guaranteed' }
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
          {/* Navigation - Revolut Style */}
          <nav className={`revolut-nav transition-all duration-300 ${scrolled ? 'py-2 shadow-lg' : 'py-4'} ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="revolut-container">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
                      <img src="/logos/SikaRemit.jpeg" alt="SikaRemit" className="w-8 h-8 object-cover rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900">
                      SikaRemit
                    </span>
                    <div className="text-xs text-gray-500 -mt-0.5">Financial Technology</div>
                  </div>
                </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link href="#features" className="revolut-nav-link">
                  Features
                </Link>
                <Link href="#pricing" className="revolut-nav-link">
                  Pricing
                </Link>
                <Link href="#about" className="revolut-nav-link">
                  About
                </Link>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <span className="revolut-nav-link cursor-help">
                      Contact
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-white border-gray-200 shadow-xl">
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-900">Get in Touch</h4>
                      <p className="text-sm text-gray-600">Reach out to our sales team or customer support for personalized assistance.</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>📧 support@sikaremit.com</p>
                        <p>📞 1-800-SIKAREMIT</p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              {/* Mobile Navigation */}
              <div className={`lg:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 space-y-2">
                  <Link href="#features" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200">
                    Features
                  </Link>
                  <Link href="#pricing" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200">
                    Pricing
                  </Link>
                  <Link href="#about" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200">
                    About
                  </Link>
                  <Link href="/contact" className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200">
                    Contact
                  </Link>
                  <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                    <Link href="/auth">
                      <Button variant="ghost" className="w-full justify-center text-gray-700">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Auth Buttons */}
              <div className="hidden lg:flex items-center space-x-4">
                <Link href="/auth">
                  <Button variant="ghost" className="font-medium text-gray-700 hover:text-gray-900">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="font-medium bg-blue-600 hover:bg-blue-700 text-white group">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
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

        {/* Hero Section - Revolut Style */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="revolut-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center min-h-[90vh] py-20">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-8">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Trusted by 50,000+ businesses</span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight">
                  Change the way you
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mt-2">
                    handle money
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Home or away, local or global — move freely between countries and currencies. 
                  Sign up for free, in a tap.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/auth">
                    <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg group">
                      Download the app
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" size="lg" className="h-14 px-8 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-lg">
                      Learn more
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>30-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>

              {/* Right Content - Phone Mockup */}
              <div className="hidden lg:flex justify-center lg:justify-end">
                <PhoneMockup />
              </div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        </section>

        {/* Stats Section - Revolut Style */}
        <section className="py-20 bg-white border-y border-gray-100">
          <div className="revolut-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Trusted by industry leaders
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Join thousands of businesses that have transformed their payment operations with SikaRemit
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg font-semibold text-gray-700 mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Revolut Style */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="revolut-container">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Powerful Features</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Everything you need to manage money
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From everyday payments to international transfers, we've got you covered with tools designed for modern businesses.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-gray-200 bg-white">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Revolut Style */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600"></div>
          <div className="revolut-container text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to transform your
                <br />
                payment experience?
              </h2>
              <p className="text-white/90 text-xl mb-10 leading-relaxed">
                Join thousands of businesses already using SikaRemit to streamline their financial operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/auth">
                  <Button size="lg" className="h-14 px-8 bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg group">
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-8 border-white/30 text-white hover:bg-white/10 font-semibold text-lg">
                    Contact Sales
                  </Button>
                </Link>
              </div>
              <p className="text-white/70 text-sm">
                No credit card required • 30-day free trial • Cancel anytime
              </p>
            </div>
          </div>
          {/* Background Elements */}
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="revolut-container">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white">SikaRemit</span>
                    <div className="text-sm text-gray-400">Financial Technology Solutions</div>
                  </div>
                </div>
                <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                  Empowering businesses worldwide with secure, fast, and reliable payment processing solutions.
                  Built for the future of digital commerce.
                </p>
                <div className="flex space-x-4">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Globe className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <CreditCard className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Shield className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Product</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                  <li><Link href="#security" className="hover:text-white transition-colors">Security</Link></li>
                  <li><Link href="/api" className="hover:text-white transition-colors">API Docs</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#about" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <p className="text-gray-400 text-sm">
                  © 2025 SikaRemit. All rights reserved.
                </p>
                <p className="text-gray-400 text-sm">
                  Powered by PayGlobe
                </p>
              </div>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
                <Link href="/compliance" className="text-gray-400 hover:text-white text-sm transition-colors">
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
