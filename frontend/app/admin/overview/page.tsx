'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutDashboard, Users, DollarSign, Activity, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface DashboardStats {
  overview: {
    total_users: number
    active_users: number
    total_revenue: number
    revenue_growth: number
    total_transactions: number
    transaction_growth: number
    pending_verifications: number
    failed_payments: number
  }
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const token = localStorage.getItem('access_token')
  const response = await axios.get(`${API_URL}/api/v1/dashboard/stats/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false
  })

  const overview = stats?.overview || {
    total_users: 0,
    active_users: 0,
    total_revenue: 0,
    revenue_growth: 0,
    total_transactions: 0,
    transaction_growth: 0,
    pending_verifications: 0,
    failed_payments: 0
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              Overview Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Quick platform overview and key metrics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link href="/admin/analytics">
              <Button variant="outline" className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/30 dark:border-slate-700/30 hover:bg-white/70 dark:hover:bg-slate-900/70 hover:border-purple-200/50 dark:hover:border-purple-700/50 shadow-lg shadow-purple-500/5 transition-all duration-300 w-full sm:w-auto">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Advanced Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </Button>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Real-time Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6" data-testid="real-time-stats">
          <Card data-testid="active-users" className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-white/30 dark:border-slate-700/30 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 dark:hover:bg-slate-900/50 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{overview.active_users}</div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Currently online</p>
            </CardContent>
          </Card>
          <Card data-testid="transaction-volume" className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-white/30 dark:border-slate-700/30 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 dark:hover:bg-slate-900/50 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{overview.total_transactions}</div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Total processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">₵{overview.total_revenue.toFixed(2)}</div>
              <p className="text-sm text-slate-600 mt-2">
                {overview.revenue_growth >= 0 ? '+' : ''}{overview.revenue_growth}% vs last period
              </p>
            </CardContent>
          </Card>

          <Card data-testid="total-users" className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Total Users</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overview.total_users}</div>
              <p className="text-sm text-slate-600 mt-2">
                {overview.active_users} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Transactions</CardTitle>
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overview.total_transactions}</div>
              <p className="text-sm text-slate-600 mt-2">
                {overview.transaction_growth >= 0 ? '+' : ''}{overview.transaction_growth}% growth
              </p>
            </CardContent>
          </Card>

          <Card data-testid="system-alerts" className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">Alerts</CardTitle>
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overview.pending_verifications + overview.failed_payments}</div>
              <p className="text-sm text-slate-600 mt-2">
                {overview.pending_verifications} pending, {overview.failed_payments} failed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card data-testid="performance-chart" className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
              <TrendingUp className="h-6 w-6 text-purple-600" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-slate-50/50 to-purple-50/50 rounded-2xl border border-white/20 shadow-inner">
              <p className="text-slate-600 text-base">Performance metrics visualization</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card data-testid="recent-activities" className="bg-white/40 backdrop-blur-xl border-white/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:bg-white/50 hover:scale-[1.01]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Admin Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-slate-600 text-base">No recent activities</p>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
