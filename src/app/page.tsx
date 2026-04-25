"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DashboardPage } from "@/components/dashboard-page"
import { AccountsPage } from "@/components/accounts-page"
import dynamic from "next/dynamic"
const InvoicesPage = dynamic(() => import('@/components/invoices-page').then(mod => mod.InvoicesPage), { ssr: false })
import { SettingsPage } from "@/components/settings-page"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

const pageConfig = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of Parasnath Jeans",
    component: DashboardPage,
  },
  accounts: {
    title: "Ledgers",
    subtitle: "Manage your Direct Agents and Agency customers",
    component: AccountsPage,
  },
  invoices: {
    title: "Invoices",
    subtitle: "Create and manage your invoices",
    component: InvoicesPage,
  },
  settings: {
    title: "Settings",
    subtitle: "Configure your preferences",
    component: SettingsPage,
  },
}

import { useStore } from "@/lib/store"

export default function Home() {
  const { organization } = useStore()
  const [activeTab, setActiveTab] = useState<keyof typeof pageConfig>("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentPage = pageConfig[activeTab]
  const PageComponent = currentPage.component
  const dynamicSubtitle = currentPage.subtitle === "Overview of Parasnath Jeans" ? `Overview of ${organization}` : currentPage.subtitle

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as keyof typeof pageConfig)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <Sidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab as keyof typeof pageConfig)
              setMobileMenuOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={currentPage.title}
          subtitle={dynamicSubtitle}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Mobile Menu Button - Only visible on mobile */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <PageComponent />
        </main>
      </div>
    </div>
  )
}
