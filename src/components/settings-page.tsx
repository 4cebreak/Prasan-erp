"use client"

import { useState } from "react"
import { Building, Shield, Database, LogOut, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/auth"
import { migrateLegacyData } from "@/app/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const settingsSections = [
  { id: "business", label: "Business Credentials", icon: Building },
  { id: "security", label: "Security & Auth", icon: Shield },
  { id: "migration", label: "Data Migration", icon: Database },
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("business")
  const { activeOrg, activeOrgId, updateOrganization, deleteOrganization, addOrganization } = useStore()
  const { logout } = useAuth()

  // Password state
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwMsg, setPwMsg] = useState("")

  // Migration state
  const [migrating, setMigrating] = useState(false)
  const [migrateMsg, setMigrateMsg] = useState("")

  // Modal states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-3">Settings</h3>
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl border border-border">
            {/* Business Section */}
            {activeSection === "business" && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Business Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure your currently active business details. Changes save automatically.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Business Name
                    </label>
                    <Input
                      value={activeOrg?.name || ""}
                      onChange={(e) => updateOrganization(activeOrgId, { name: e.target.value })}
                      className="rounded-xl h-12 bg-muted border-0 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      GST Number
                    </label>
                    <Input
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      value={activeOrg?.gstNumber || ""}
                      onChange={(e) => updateOrganization(activeOrgId, { gstNumber: e.target.value })}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      PAN Number
                    </label>
                    <Input
                      placeholder="e.g. ABCDE1234F"
                      value={activeOrg?.panNumber || ""}
                      onChange={(e) => updateOrganization(activeOrgId, { panNumber: e.target.value })}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Business Address
                    </label>
                    <Input
                      placeholder="e.g. 123 Denim Street"
                      value={activeOrg?.address || ""}
                      onChange={(e) => updateOrganization(activeOrgId, { address: e.target.value })}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      City
                    </label>
                    <Input
                      placeholder="e.g. Mumbai"
                      value={activeOrg?.city || ""}
                      onChange={(e) => updateOrganization(activeOrgId, { city: e.target.value })}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      State
                    </label>
                    <Input
                      placeholder="e.g. Maharashtra"
                      value={activeOrg?.state || ""}
                      onChange={(e) => updateOrganization(activeOrgId, { state: e.target.value })}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Advanced Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="rounded-xl border-primary text-primary hover:bg-primary/5"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add New Business
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Business</DialogTitle>
                          <DialogDescription>
                            Enter the name of your new business entity.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Input 
                            placeholder="Business Name" 
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newOrgName.trim()) {
                                addOrganization(newOrgName.trim())
                                setNewOrgName("")
                                setIsAddDialogOpen(false)
                              }
                            }}
                            autoFocus
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                          <Button 
                            onClick={() => {
                              if (newOrgName.trim()) {
                                addOrganization(newOrgName.trim())
                                setNewOrgName("")
                                setIsAddDialogOpen(false)
                              }
                            }}
                          >
                            Create Business
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="rounded-xl flex-1 md:flex-none"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete This Business
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the 
                            <strong> {activeOrg?.name}</strong> business and all of its associated data (accounts, invoices, ledgers).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              deleteOrganization(activeOrgId)
                              setIsDeleteDialogOpen(false)
                            }}
                          >
                            Delete Business
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Security & Authentication</h2>
                  <p className="text-sm text-muted-foreground">Change your master password or log out of the system.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="rounded-xl h-12 bg-muted border-0"
                    />
                  </div>
                </div>

                {pwMsg && (
                  <div className={cn(
                    "text-sm rounded-xl px-4 py-2.5 font-medium",
                    pwMsg.includes("success") ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                  )}>
                    {pwMsg}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    className="rounded-xl bg-primary hover:bg-primary/90"
                    onClick={async () => {
                      if (newPw !== confirmPw) { setPwMsg("Passwords do not match."); return }
                      if (newPw.length < 4) { setPwMsg("Password must be at least 4 characters."); return }

                      const encoder = new TextEncoder()
                      const curHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(currentPw)))).map(b => b.toString(16).padStart(2, "0")).join("")
                      const storedHash = localStorage.getItem("jeans_master_password_hash") || "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
                      if (curHash !== storedHash) { setPwMsg("Current password is incorrect."); return }

                      const newHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(newPw)))).map(b => b.toString(16).padStart(2, "0")).join("")
                      localStorage.setItem("jeans_master_password_hash", newHash)
                      setCurrentPw(""); setNewPw(""); setConfirmPw("")
                      setPwMsg("Password changed successfully!")
                    }}
                  >
                    Update Password
                  </Button>
                  <Button variant="destructive" className="rounded-xl" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" /> Log Out
                  </Button>
                </div>
              </div>
            )}

            {/* Migration Section */}
            {activeSection === "migration" && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Legacy Data Migration</h2>
                  <p className="text-sm text-muted-foreground">Transfer your existing browser data (localStorage) into the permanent SQLite database. This is a one-time operation.</p>
                </div>

                {migrateMsg && (
                  <div className={cn(
                    "text-sm rounded-xl px-4 py-2.5 font-medium",
                    migrateMsg.includes("Success") ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                  )}>
                    {migrateMsg}
                  </div>
                )}

                <Button
                  className="rounded-xl bg-primary hover:bg-primary/90"
                  disabled={migrating}
                  onClick={async () => {
                    setMigrating(true)
                    setMigrateMsg("")
                    try {
                      // Gather legacy data from localStorage
                      const orgsRaw = localStorage.getItem("jeans_organizations")
                      const orgs = orgsRaw ? JSON.parse(orgsRaw) : [
                        { id: "parasnath", name: "Parasnath Jeans" },
                        { id: "jsgarments", name: "JS Garments" }
                      ]

                      const pAccRaw = localStorage.getItem("jeans_parasnath_accounts") || localStorage.getItem("jeans_accounts")
                      const pInvRaw = localStorage.getItem("jeans_parasnath_invoices") || localStorage.getItem("jeans_invoices")
                      const jAccRaw = localStorage.getItem("jeans_jsgarments_accounts")
                      const jInvRaw = localStorage.getItem("jeans_jsgarments_invoices")

                      const result = await migrateLegacyData({
                        organizations: orgs,
                        parasnathAccounts: pAccRaw ? JSON.parse(pAccRaw) : [],
                        parasnathInvoices: pInvRaw ? JSON.parse(pInvRaw) : [],
                        jsAccounts: jAccRaw ? JSON.parse(jAccRaw) : [],
                        jsInvoices: jInvRaw ? JSON.parse(jInvRaw) : []
                      })

                      if (result.success) {
                        setMigrateMsg("Success! All legacy data has been transferred to the database. Refresh the page to see your data.")
                      } else {
                        setMigrateMsg(`Error: ${result.error}`)
                      }
                    } catch (err: any) {
                      setMigrateMsg(`Error: ${err.message}`)
                    }
                    setMigrating(false)
                  }}
                >
                  {migrating ? "Migrating..." : "Migrate Browser Data → SQLite"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  This will scan all existing data stored in your browser and copy it into the permanent database file.
                  Your browser data will not be deleted — you can clear it manually afterward.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
