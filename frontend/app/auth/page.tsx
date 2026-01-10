'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, UserPlus, LogIn, Sparkles, Shield, Building2, Users } from 'lucide-react'

export default function AuthPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="space-y-8 text-center relative overflow-hidden">
      {/* Animated background elements for the card */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-r from-blue-400/8 to-purple-400/8 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-conic from-purple-500/3 via-transparent to-pink-500/3 rounded-full blur-lg animate-spin" style={{animationDuration: '15s'}}></div>
      </div>
      {/* Welcome Header */}
      <div className="space-y-6 relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/30 animate-in zoom-in-50 duration-700 relative group">
          <Sparkles className="w-10 h-10 text-white group-hover:rotate-12 transition-transform duration-500" />
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/40 to-pink-500/40 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-700"></div>
        </div>

        <div className="space-y-3 animate-in slide-in-from-bottom duration-700 delay-300">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent leading-tight">
            Welcome to SikaRemit
          </h1>
          <p className="text-base text-slate-600/90 max-w-sm mx-auto leading-relaxed font-medium">
            Your gateway to <span className="text-purple-600 font-semibold">secure</span>, <span className="text-purple-600 font-semibold">fast</span>, and <span className="text-purple-600 font-semibold">reliable</span> payment solutions worldwide
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-6 animate-in slide-in-from-bottom duration-700 delay-500 relative z-10">
        <Link href="/auth/login" className="block group">
          <Button
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <LogIn className="w-6 h-6 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
            <span className="font-semibold text-base">Sign In to Your Account</span>
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
          </Button>
        </Link>

        <Link href="/auth/register" className="block group">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 border-2 border-purple-200/60 text-purple-700 hover:text-white hover:border-purple-300 bg-white/50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500 backdrop-blur-sm shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <UserPlus className="w-6 h-6 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
            <span className="font-semibold text-base">Create New Account</span>
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
          </Button>
        </Link>
      </div>

      {/* Portal Access */}
      <div className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-600 relative z-10">
        <div className="text-sm text-slate-600/80 font-medium">
          Access Specialized Portals
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/auth/admin" className="block group">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 border-2 border-red-200/60 text-red-700 hover:text-white hover:border-red-300 bg-white/30 hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-500 backdrop-blur-sm shadow-lg shadow-red-500/5 hover:shadow-xl hover:shadow-red-500/15 transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/15 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Shield className="w-5 h-5 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              <span className="font-semibold text-sm">Admin Portal</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
            </Button>
          </Link>

          <Link href="/auth/merchant" className="block group">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 border-2 border-emerald-200/60 text-emerald-700 hover:text-white hover:border-emerald-300 bg-white/30 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-500 backdrop-blur-sm shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/15 to-emerald-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <Building2 className="w-5 h-5 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              <span className="font-semibold text-sm">Merchant Portal</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Additional Links */}
      <div className="space-y-4 pt-2 animate-in slide-in-from-bottom duration-700 delay-800 relative z-10">
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="text-purple-600 hover:text-purple-700 hover:underline transition-all duration-300 hover:scale-105 font-medium relative group">
            Forgot your password?
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></div>
          </Link>
        </div>

        <div className="text-xs text-slate-500/80 space-y-2 px-4">
          <p className="font-medium">Need help? Contact our support team</p>
          <Link href="/contact" className="text-purple-600 hover:text-purple-700 hover:underline transition-all duration-300 hover:scale-105 font-medium inline-block relative group">
            support@sikaremit.com
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-500 group-hover:w-full transition-all duration-300"></div>
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-2xl animate-in zoom-in-50 duration-1000 delay-800 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-blue-400/12 to-purple-400/12 rounded-full blur-2xl animate-in zoom-in-50 duration-1000 delay-1000 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-purple-300/20 rounded-full blur-lg animate-bounce delay-500"></div>
        <div className="absolute bottom-1/4 right-1/4 w-6 h-6 bg-pink-300/20 rounded-full blur-lg animate-bounce delay-1000"></div>
      </div>
    </div>
  )
}