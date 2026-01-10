'use client'

import { ArrowDownLeft, ArrowUpRight, Smartphone, Wallet, Send, Receipt } from 'lucide-react'

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'topup' | 'bill'
  name: string
  amount: string
  currency: string
  date: string
  status: 'completed' | 'pending'
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'send',
    name: 'John Mensah',
    amount: '-150.00',
    currency: 'GHS',
    date: 'Today, 2:30 PM',
    status: 'completed'
  },
  {
    id: '2',
    type: 'receive',
    name: 'Sarah Owusu',
    amount: '+500.00',
    currency: 'GHS',
    date: 'Today, 11:15 AM',
    status: 'completed'
  },
  {
    id: '3',
    type: 'topup',
    name: 'MTN Airtime',
    amount: '-20.00',
    currency: 'GHS',
    date: 'Yesterday',
    status: 'completed'
  },
  {
    id: '4',
    type: 'bill',
    name: 'ECG Electricity',
    amount: '-85.50',
    currency: 'GHS',
    date: 'Yesterday',
    status: 'completed'
  },
  {
    id: '5',
    type: 'send',
    name: 'Kwame Asante',
    amount: '-200.00',
    currency: 'GHS',
    date: 'Dec 19',
    status: 'completed'
  }
]

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'send':
      return <ArrowUpRight className="w-4 h-4" />
    case 'receive':
      return <ArrowDownLeft className="w-4 h-4" />
    case 'topup':
      return <Smartphone className="w-4 h-4" />
    case 'bill':
      return <Receipt className="w-4 h-4" />
    default:
      return <Send className="w-4 h-4" />
  }
}

const getTransactionColor = (type: Transaction['type']) => {
  switch (type) {
    case 'send':
      return 'bg-orange-500/10 text-orange-500'
    case 'receive':
      return 'bg-green-500/10 text-green-500'
    case 'topup':
      return 'bg-blue-500/10 text-blue-500'
    case 'bill':
      return 'bg-purple-500/10 text-purple-500'
    default:
      return 'bg-gray-500/10 text-gray-500'
  }
}

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] md:w-[320px]">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/50">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20"></div>
        
        {/* Phone Screen */}
        <div className="relative bg-background rounded-[2.5rem] overflow-hidden h-[580px] md:h-[620px]">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-muted-foreground rounded-sm"></div>
              <div className="w-4 h-2 bg-muted-foreground rounded-sm"></div>
              <div className="w-6 h-3 bg-green-500 rounded-sm"></div>
            </div>
          </div>

          {/* App Header */}
          <div className="bg-card px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">SikaRemit</h3>
                <p className="text-xs text-muted-foreground">Your Digital Wallet</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="px-4 py-4">
            <div className="bg-gradient-to-br from-primary via-purple-600 to-pink-600 rounded-2xl p-5 text-white shadow-lg shadow-primary/30">
              <p className="text-sm opacity-80 mb-1">Available Balance</p>
              <p className="text-3xl font-bold mb-3">GHS 2,450.00</p>
              <div className="flex gap-3">
                <button className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl py-2 text-xs font-medium hover:bg-white/30 transition-colors">
                  <Send className="w-3 h-3 inline mr-1" />
                  Send
                </button>
                <button className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl py-2 text-xs font-medium hover:bg-white/30 transition-colors">
                  <ArrowDownLeft className="w-3 h-3 inline mr-1" />
                  Request
                </button>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground text-sm">Recent Transactions</h4>
              <span className="text-xs text-primary font-medium">See all</span>
            </div>
            
            <div className="space-y-2">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{transaction.name}</p>
                      <p className="text-xs text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      transaction.amount.startsWith('+') ? 'text-green-500' : 'text-foreground'
                    }`}>
                      {transaction.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3">
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] text-primary font-medium">Home</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground">Send</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground">History</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -z-10 top-1/4 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -z-10 bottom-1/4 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
    </div>
  )
}

export default PhoneMockup
