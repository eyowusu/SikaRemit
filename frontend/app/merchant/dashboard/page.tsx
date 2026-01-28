'use client'

import { DollarSign, TrendingUp, Wallet, Activity, BarChart3, Activity as ActivityIcon, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { getMerchantDashboard } from '@/lib/api/merchant'
import { useCurrency } from '@/hooks/useCurrency'
import { QUICK_ACTIONS } from '@/lib/constants/merchant-ui'
import RecentTransactions from '@/components/merchant/recent-transactions'
import RevenueChart from '@/components/merchant/revenue-chart'
import SalesChart from '@/components/merchant/sales-chart'
import { useAuth } from '@/lib/auth/context'
import { useSession } from '@/lib/auth/session-provider'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function MerchantDashboard() {
  const session = useSession()
  const { userTypeInfo } = useAuth()
  const { formatAmount } = useCurrency()

  const { data: dashboardData } = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: getMerchantDashboard,
    refetchInterval: 30000
  })

  const stats = [
    {
      title: 'Revenue',
      value: formatAmount(dashboardData?.overview?.total_revenue || 0),
      icon: DollarSign,
      gradient: 'from-purple-600 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      trend: '',
      change: ''
    },
    {
      title: 'Today',
      value: formatAmount(0),
      icon: TrendingUp,
      gradient: 'from-purple-600 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      trend: '',
      change: ''
    },
    {
      title: 'Balance',
      value: formatAmount(dashboardData?.overview?.pending_payouts || 0),
      icon: Wallet,
      gradient: 'from-purple-600 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      trend: 'Available',
      change: 'Ready to withdraw'
    },
    {
      title: 'Transactions',
      value: dashboardData?.overview?.total_transactions || 0,
      icon: ActivityIcon,
      gradient: 'from-purple-600 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      trend: 'This month',
      change: 'Active payments'
    }
  ]

  return (
    <div className="min-h-screen bg-sikaremit-card">
      {/* Hero Section - Matching homepage style */}
      <section className="relative py-8 sm:py-12 lg:py-16 xl:py-24 overflow-hidden bg-gradient-to-br from-purple-50/30 via-blue-50/20 to-pink-50/30">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] bg-gradient-conic from-purple-500/5 via-transparent to-blue-500/5 rounded-full blur-xl sm:blur-2xl animate-spin" style={{animationDuration: '20s'}}></div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-in slide-in-from-bottom duration-1000">
            <div className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 shadow-lg shadow-purple-500/5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold mb-6 sm:mb-8 animate-in zoom-in-50 duration-700 delay-300 hover:bg-white/50 dark:hover:bg-slate-900/50 hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
              <ActivityIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
              Merchant Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-6 leading-tight animate-in slide-in-from-bottom duration-1000 delay-500">
              Welcome back, {session?.user?.name}!
              <span className="block bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">Here's your business overview</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600/90 dark:text-slate-400/90 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom duration-1000 delay-700 font-medium">
              Track your revenue, manage transactions, and grow your business with sikaremit's comprehensive merchant tools.
            </p>
            {userTypeInfo && (
              <div className="mb-6 flex justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  userTypeInfo.bgColor
                } ${
                  userTypeInfo.color
                } shadow-lg`}>
                  <span className="text-lg">{userTypeInfo.icon}</span>
                  {userTypeInfo.label}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center animate-in slide-in-from-bottom duration-1000 delay-900">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/30 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:bg-white/50 dark:hover:bg-slate-900/50 group">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Real-time updates</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/30 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:bg-white/50 dark:hover:bg-slate-900/50 group">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">Secure & compliant</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-white/30 dark:border-slate-700/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:bg-white/50 dark:hover:bg-slate-900/50 group">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-slate-700 dark:text-slate-300 font-medium text-sm sm:text-base">24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 lg:px-8 space-y-8 sm:space-y-12">
        {/* Key Metrics Overview - Matching homepage card style */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-sikaremit-foreground mb-4">Key Metrics</h2>
            <p className="text-lg text-sikaremit-muted max-w-2xl mx-auto">Your business performance at a glance</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <Card key={stat.title} className="bg-sikaremit-card/80 backdrop-blur-sm group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/10 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-10 -mt-10"></div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                  <CardTitle className="text-sm font-semibold text-sikaremit-muted uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold text-sikaremit-foreground mb-2">{stat.value}</div>
                  <div className="space-y-1">
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center ${
                      stat.trend.includes('+') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      stat.trend.includes('Available') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend}
                    </div>
                    <p className="text-xs text-sikaremit-muted">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions Section - Matching homepage style */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-sikaremit-foreground mb-4">Quick Actions</h2>
            <p className="text-lg text-sikaremit-muted max-w-2xl mx-auto">Common tasks to manage your business</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {QUICK_ACTIONS.map((action, index) => (
              <Link key={action.title} href={action.href} className="flex">
                <Card className="w-full bg-sikaremit-card/80 backdrop-blur-sm group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/10 relative overflow-hidden flex flex-col">
                  <CardContent className="p-8 relative flex-grow flex flex-col justify-center">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:rotate-3">
                        <Activity className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sikaremit-foreground group-hover:text-sikaremit-primary transition-colors text-lg">
                          {action.title}
                        </h3>
                        <p className="text-sm text-sikaremit-muted group-hover:text-sikaremit-foreground/80 transition-colors mt-2 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Analytics Section - Professional charts */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-sikaremit-foreground mb-4">Analytics & Insights</h2>
            <p className="text-lg text-sikaremit-muted max-w-2xl mx-auto">Deep dive into your business performance</p>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card className="border-0 shadow-xl bg-sikaremit-card/80 backdrop-blur-sm bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/10 relative overflow-hidden">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-sikaremit-foreground">Revenue Trends</CardTitle>
                    <CardDescription className="text-sikaremit-muted">Monthly revenue performance over time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80 w-full">
                  <RevenueChart />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-sikaremit-card/80 backdrop-blur-sm bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/10 relative overflow-hidden">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-sikaremit-foreground">Recent Activity</CardTitle>
                    <CardDescription className="text-sikaremit-muted">Latest transactions and customer interactions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                  <RecentTransactions />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card className="border-0 shadow-xl bg-sikaremit-card/80 backdrop-blur-sm bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/10 relative overflow-hidden">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-sikaremit-foreground">Performance Overview</CardTitle>
                  <CardDescription className="text-sikaremit-muted">Comprehensive sales analytics and business insights</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80 w-full">
                <SalesChart />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
