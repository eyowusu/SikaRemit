
'use client'

import { useSession } from '@/lib/auth/session-provider'
import { useAuth } from '@/lib/auth/context'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Send,
  Receipt,
  CreditCard,
  TrendingUp,
  DollarSign,
  ArrowRight,
  History,
  Settings,
  Download,
  Wallet,
  Smartphone,
  Building2,
  Globe,
  Wifi,
  ArrowDownToLine
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRealtimeUpdates } from '@/lib/hooks/useRealtimeUpdates'
import { getCustomerPayments, getCustomerReceipts, getAccountBalance, getCustomerStats, CustomerStats } from '@/lib/api/customer'
import type { Payment, Receipt as ReceiptType, AccountBalance } from '@/lib/types/customer'
import { useEffect } from 'react'
import { useCurrency } from '@/hooks/useCurrency'

export const dynamic = 'force-dynamic'

export default function CustomerDashboard() {
  const session = useSession()
  const { user, userTypeInfo, loading } = useAuth()
  const status = session.status

  // Enable real-time updates (disabled for now)
  // const { isConnected } = useRealtimeUpdates('dashboard')

  const { formatAmount, formatAmountFromBase, currency } = useCurrency()

  const { data: recentPayments } = useQuery<Payment[]>({
    queryKey: ['customer-payments'],
    queryFn: getCustomerPayments,
    select: (data) => data?.slice(0, 5) // Get only recent 5 payments
  })

  const { data: recentReceipts } = useQuery<ReceiptType[]>({
    queryKey: ['customer-receipts'],
    queryFn: getCustomerReceipts,
    select: (data) => data?.slice(0, 3) // Get only recent 3 receipts
  })

  const { data: accountBalance } = useQuery<AccountBalance>({
    queryKey: ['account-balance'],
    queryFn: getAccountBalance
  })

  const { data: customerStats } = useQuery<CustomerStats>({
    queryKey: ['customer-stats'],
    queryFn: getCustomerStats
  })


  useEffect(() => {
    if (session && (session?.user as any)?.token) {
      localStorage.setItem('access_token', (session.user as any).token)
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <DollarSign className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Loading your dashboard</h2>
            <p className="text-muted-foreground">Please wait while we verify your account...</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' && !user) {
    redirect('/auth')
    return null
  }

  if (user && user.role !== 'customer') {
    const roleRedirects = {
      admin: '/admin/overview',
      merchant: '/merchant/dashboard',
      customer: '/customer/dashboard'
    };
    const redirectPath = roleRedirects[user.role as keyof typeof roleRedirects] || '/auth';
    redirect(redirectPath);
    return null;
  }


  const quickActions = [
    {
      title: 'Deposit',
      description: 'Add funds to your balance instantly',
      icon: Wallet,
      href: '/customer/payments/top-up',
      iconColor: 'bg-emerald-500/10 text-emerald-500'
    },
    {
      title: 'Withdraw',
      description: 'Withdraw to Mobile Money or Bank',
      icon: ArrowDownToLine,
      href: '/customer/payments/withdraw',
      iconColor: 'bg-red-500/10 text-red-500'
    },
    {
      title: 'Send Domestic',
      description: 'Transfer money within the same country',
      icon: Send,
      href: '/customer/payments/domestic',
      iconColor: 'bg-blue-500/10 text-blue-500'
    },
    {
      title: 'Send International',
      description: 'Transfer money across borders',
      icon: Globe,
      href: '/customer/payments/cross-border',
      iconColor: 'bg-green-500/10 text-green-500'
    },
    {
      title: 'Buy Airtime',
      description: 'Purchase airtime for any network',
      icon: Smartphone,
      href: '/customer/payments/airtime',
      iconColor: 'bg-orange-500/10 text-orange-500'
    },
    {
      title: 'Buy Data Bundle',
      description: 'Buy data packages for internet access',
      icon: Wifi,
      href: '/customer/payments/data',
      iconColor: 'bg-cyan-500/10 text-cyan-500'
    },
    {
      title: 'Pay Bills',
      description: 'Pay utilities, taxes, loans, and other bills',
      icon: Receipt,
      href: '/customer/payments/bills',
      iconColor: 'bg-purple-500/10 text-purple-500'
    }
  ]

  return (
    <div className="revolut-container py-4 sm:py-6 lg:py-8">
          {/* Header - Revolut Style */}
          <div className="mb-10">
            <div className="mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 sm:gap-4 mb-2">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-revolut">
                    <DollarSign className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                      Welcome back, {(session?.user as any)?.firstName || 'Customer'}!
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Your financial dashboard awaits
                    </p>
                    {userTypeInfo && (
                      <div className="mt-3">
                        <span className="revolut-badge">
                          <span>{userTypeInfo.icon}</span>
                          {userTypeInfo.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-muted-foreground">System Online</span>
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Card - Revolut Style */}
          <div className="mb-6 sm:mb-10">
            <div className="revolut-balance-card">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Available Balance</p>
                        <p className="text-xs text-white/50 uppercase tracking-wide">{currency}</p>
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                      {formatAmountFromBase(accountBalance?.available || 0, 'GHS')}
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-2 sm:space-y-4">
                    <div>
                      <p className="text-sm text-white/60">Pending</p>
                      <p className="text-2xl font-semibold">
                        {formatAmountFromBase(accountBalance?.pending || 0, 'GHS')}
                      </p>
                    </div>
                    <p className="text-xs text-white/40">
                      Updated: {accountBalance?.last_updated ? new Date(accountBalance.last_updated).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-sm">
                    <span className="text-white/70">Quick Stats</span>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="font-semibold text-lg">{customerStats?.transactions_this_month || 0}</div>
                        <div className="text-xs text-white/60">This Month</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">{customerStats?.success_rate?.toFixed(1) || 0}%</div>
                        <div className="text-xs text-white/60">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Revolut Style */}
          <div className="mb-6 sm:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">Quick Actions</h2>
                <p className="text-muted-foreground text-sm">Everything you need, just one click away</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">All Systems Operational</span>
              </div>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href} className="block">
                  <div className="revolut-quick-action h-full">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${action.iconColor} flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-1 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed hidden sm:block">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Section - Revolut Style */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="border-b border-border p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground text-base sm:text-lg">Recent Transactions</CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Your latest payment activity</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link href="/customer/account">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {!recentPayments || recentPayments.length === 0 ? (
                    <div key="no-payments" className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <History className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium mb-1">No transactions yet</p>
                      <p className="text-sm text-muted-foreground">Start by sending money or paying a bill</p>
                    </div>
                  ) : (
                    <div key="payments-list" className="space-y-2 sm:space-y-3">
                      {recentPayments.map((payment, index) => (
                        <div key={payment.id || `payment-${index}`} className="revolut-transaction flex-col sm:flex-row gap-2 sm:gap-0">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              payment.status === 'completed'
                                ? 'bg-green-500/10 text-green-500'
                                : payment.status === 'pending'
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{formatAmountFromBase(payment.amount, 'GHS')}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.created_at).toLocaleDateString()} • To: {payment.merchant}
                              </p>
                            </div>
                          </div>
                          <span className={`revolut-status ${
                            payment.status === 'completed'
                              ? 'revolut-status-success'
                              : payment.status === 'pending'
                              ? 'revolut-status-pending'
                              : 'revolut-status-error'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Receipts */}
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="border-b border-border p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-base sm:text-lg">Recent Receipts</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Your latest receipts</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {!recentReceipts || recentReceipts.length === 0 ? (
                    <p key="no-receipts" className="text-sm text-muted-foreground text-center py-4">No receipts yet</p>
                  ) : (
                    <div key="receipts-list" className="space-y-3">
                      {recentReceipts.map((receipt, index) => (
                        <div key={receipt.id || `receipt-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                          <span className="font-medium text-foreground">{formatAmountFromBase(receipt.amount, 'GHS')}</span>
                          <Button variant="ghost" size="sm" asChild className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10">
                            <a href={receipt.download_url} download className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    }
