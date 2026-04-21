"use client"

import { TrendingUp, TrendingDown, DollarSign, Users, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

export function DashboardPage() {
  const { accounts, invoices } = useStore()

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
  const totalAccounts = accounts.length
  
  const pendingInvoices = invoices.filter(i => i.status === "pending").length
  
  const outstanding = invoices
    .filter(i => i.status === "pending" || i.status === "overdue")
    .reduce((sum, inv) => sum + inv.grandTotal, 0)

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      change: "+",
      trend: "up",
      icon: DollarSign,
      color: "primary",
    },
    {
      title: "Total Accounts",
      value: totalAccounts.toString(),
      change: "+",
      trend: "up",
      icon: Users,
      color: "accent",
    },
    {
      title: "Pending Invoices",
      value: pendingInvoices.toString(),
      change: "-",
      trend: "down",
      icon: FileText,
      color: "warning",
    },
    {
      title: "Outstanding",
      value: `₹${outstanding.toLocaleString("en-IN")}`,
      change: "-",
      trend: "down",
      icon: TrendingDown,
      color: "destructive",
    },
  ]

  // Flatten logic to get recent transactions from Ledger entries across accounts
  const allEntries = accounts.flatMap(acc => 
    acc.ledger.map(entry => ({
      id: entry.id,
      account: acc.name,
      type: entry.type === "bill" ? "Bill" : "Payment Received",
      amount: entry.type === "bill" ? -entry.amount : entry.amount,
      dateStr: entry.date,
      date: new Date(entry.date).toLocaleDateString()
    }))
  )
  const recentTransactions = allEntries
    .sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime())
    .slice(0, 5)

  // Top Customers based on balance
  const topCustomersData = [...accounts]
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const maxBalance = Math.max(...topCustomersData.map(c => c.balance), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-6 border border-primary/20">
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here is what is happening with your jeans business today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon as any
          return (
            <div
              key={stat.title}
              className="bg-card rounded-2xl p-5 border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "p-3 rounded-xl",
                    stat.color === "primary" && "bg-primary/10",
                    stat.color === "accent" && "bg-accent/10",
                    stat.color === "warning" && "bg-warning/10",
                    stat.color === "destructive" && "bg-destructive/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      stat.color === "primary" && "text-primary",
                      stat.color === "accent" && "text-accent",
                      stat.color === "warning" && "text-warning",
                      stat.color === "destructive" && "text-destructive"
                    )}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
            <p className="text-sm text-muted-foreground">Latest account ledger activities</p>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No recent transactions yet</div>
            )}
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      transaction.amount > 0 ? "bg-accent/10" : "bg-destructive/10"
                    )}
                  >
                    {transaction.amount > 0 ? (
                      <TrendingUp className="w-5 h-5 text-accent" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{transaction.account}</p>
                    <p className="text-xs text-muted-foreground">{transaction.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold",
                      transaction.amount > 0 ? "text-accent" : "text-destructive"
                    )}
                  >
                    {transaction.amount > 0 ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-card rounded-2xl border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Top Customers</h3>
            <p className="text-sm text-muted-foreground">Highest balance accounts</p>
          </div>
          <div className="p-5 space-y-4">
            {topCustomersData.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">No customers found</div>
            )}
            {topCustomersData.map((customer, index) => (
              <div
                key={customer.name}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(Math.max(customer.balance, 0) / maxBalance) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">{formatCurrency(customer.balance)}</p>
                  {customer.balance >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-accent inline" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive inline" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
