'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, CreditCard, Smartphone, Monitor, Store, Activity } from 'lucide-react'
import DeviceManagement from './components/DeviceManagement'
import TransactionProcessing from './components/TransactionProcessing'
import TransactionHistory from './components/TransactionHistory'
import POSDashboard from './components/POSDashboard'

const POSPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [devices, setDevices] = useState([])
  const [transactions, setTransactions] = useState([])
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    fetchDashboardData()
    fetchDevices()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/payments/pos/dashboard/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/v1/payments/pos/devices/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDevices(data.results || data)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground">
            Manage your POS devices and process transactions
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Process Transaction
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <POSDashboard data={dashboardData} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <DeviceManagement devices={devices} onDeviceUpdate={fetchDevices} />
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          <TransactionProcessing devices={devices} onTransactionComplete={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default POSPage
