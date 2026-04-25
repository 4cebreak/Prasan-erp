"use client"

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react"
import { 
  fetchStoreContext, serverAddAccount, serverUpdateAccount, serverDeleteAccount, 
  serverAddLedgerEntry, serverUpdateLedgerEntry, serverDeleteLedgerEntry, serverAddInvoice, serverUpdateInvoice, serverDeleteInvoice, 
  serverAddOrganization, serverUpdateOrganization, serverDeleteOrganization 
} from "@/app/actions"

export interface LedgerEntry {
  id: string
  date: string
  party: string
  station: string
  amount: number
  discount: number
  taxOrPaid: number
  netAmount: number
  items: string
  payment: number
  type: "bill" | "payment"
  paymentMode?: string
}

export interface Account {
  id: string
  name: string
  type: "Direct Agent" | "Agency"
  station: string
  balance: number
  ledger: LedgerEntry[]
}

interface ItemRow {
  sno: number
  style: string
  brandName: string
  size: string
  qty: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  invoiceNo: string
  date: string
  customerName: string
  agencyName: string
  city?: string
  transport?: string
  remarks?: string
  marka?: string
  items: ItemRow[]
  subtotal: number
  discount: number
  taxes: number
  grandTotal: number
  status: "paid" | "pending" | "overdue"
}

export interface OrgConfig {
  id: string
  name: string
  gstNumber?: string
  panNumber?: string
  address?: string
  city?: string
  state?: string
}

interface StoreState {
  accounts: Account[]
  invoices: Invoice[]
  addAccount: (account: Omit<Account, "id" | "balance" | "ledger">) => void
  updateAccount: (id: string, account: Partial<Account>) => void
  addLedgerEntry: (accountId: string, entry: Omit<LedgerEntry, "id">) => void
  updateLedgerEntry: (accountId: string, entryId: string, entry: Partial<LedgerEntry>) => void
  deleteLedgerEntry: (accountId: string, entryId: string) => void
  deleteAccount: (id: string) => void
  addInvoice: (invoice: Omit<Invoice, "id" | "status">) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  organizations: OrgConfig[]
  activeOrgId: string
  activeOrg: OrgConfig
  addOrganization: (name: string) => void
  updateOrganization: (id: string, updates: Partial<OrgConfig>) => void
  deleteOrganization: (id: string) => void
  organization: string
  setOrganization: (id: string) => void
}

const StoreContext = createContext<StoreState | undefined>(undefined)

const initialAccounts: Account[] = [
  { id: "1", name: "ABC RETAIL PVT LTD", type: "Direct Agent", station: "City A", balance: 1146, ledger: [] },
  { id: "2", name: "XYZ AGENCIES", type: "Agency", station: "City B", balance: -5000, ledger: [] }
]

const initialInvoices: Invoice[] = []

export function StoreProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<OrgConfig[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string>("abc-company")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const hasRestoredOrg = useRef(false)

  // Fetch asynchronously from SQLite via Server Action
  useEffect(() => {
    setIsLoaded(false)
    
    // Restore saved org only on first mount
    if (!hasRestoredOrg.current) {
      hasRestoredOrg.current = true
      const memoryOrgId = localStorage.getItem("jeans_active_org")
      if (memoryOrgId && memoryOrgId !== activeOrgId) {
        setActiveOrgId(memoryOrgId)
        return
      }
    }

    fetchStoreContext(activeOrgId).then((res) => {
      // Prisma returns Date objects, we safely serialize them to maintain exact client types.
      setOrganizations(res.organizations.map((o: any) => ({
        ...o,
        gstNumber: o.gstNumber || undefined,
        panNumber: o.panNumber || undefined,
        address: o.address || undefined,
        city: o.city || undefined,
        state: o.state || undefined,
      })))
      
      const serializedAccounts = res.accounts.map((acc: any) => ({
        ...acc,
        ledger: acc.ledger.map((l: any) => ({ ...l, date: typeof l.date === 'string' ? l.date : l.date.toISOString() }))
      }))
      setAccounts(serializedAccounts as Account[])

      const serializedInvoices = res.invoices.map((inv: any) => ({
        ...inv,
        date: typeof inv.date === 'string' ? inv.date : inv.date.toISOString(),
      }))
      setInvoices(serializedInvoices as Invoice[])
      
      setIsLoaded(true)
    }).catch(err => {
      console.error("SQL fetch failed", err)
      setIsLoaded(true)
    })
  }, [activeOrgId])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("jeans_active_org", activeOrgId)
    }
  }, [activeOrgId, isLoaded])

  const addOrganization = async (name: string) => {
    const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now()
    const newOrg = { id: newId, name }
    
    // Optimistic
    setOrganizations(prev => [...prev, newOrg])
    setActiveOrgId(newId)
    
    // SQL Exec
    await serverAddOrganization(name, newId)
  }

  const updateOrganization = async (id: string, updates: Partial<OrgConfig>) => {
    setOrganizations(prev => prev.map(o => (o.id === id ? { ...o, ...updates } : o)))
    await serverUpdateOrganization(id, updates)
  }

  const deleteOrganization = async (id: string) => {
    const remaining = organizations.filter(o => o.id !== id)
    setOrganizations(remaining)
    if (activeOrgId === id) {
      const nextOrg = remaining[0]?.id || "abc-company"
      setActiveOrgId(nextOrg)
    }
    await serverDeleteOrganization(id)
  }

  const addAccount = async (acc: Omit<Account, "id" | "balance" | "ledger">) => {
    const newId = Date.now().toString()
    const newAccount: Account = { ...acc, id: newId, balance: 0, ledger: [] }
    setAccounts(prev => [...prev, newAccount])
    await serverAddAccount(activeOrgId, { ...acc, id: newId, balance: 0 })
  }

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
    await serverUpdateAccount(id, updates)
  }

  const deleteAccount = async (id: string) => {
    setAccounts(prev => prev.filter((a) => a.id !== id))
    await serverDeleteAccount(id)
  }

  const addLedgerEntry = async (accountId: string, entry: Omit<LedgerEntry, "id">) => {
    // 1. Optimistic update with temp ID
    const tempId = "temp-" + Date.now()
    setAccounts(prev => prev.map((acc) => {
      if (acc.id === accountId) {
        const newEntry = { ...entry, id: tempId }
        const newBalance = acc.balance + (entry.amount - entry.discount + entry.taxOrPaid - entry.payment)
        return { ...acc, balance: newBalance, ledger: [...acc.ledger, newEntry] }
      }
      return acc
    }))
    
    // 2. Server call
    try {
      const savedEntry = await serverAddLedgerEntry(accountId, entry)
      // 3. Replace temp ID with real ID from server
      setAccounts(prev => prev.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            ledger: acc.ledger.map(e => e.id === tempId ? { ...savedEntry, date: typeof savedEntry.date === 'string' ? savedEntry.date : savedEntry.date.toISOString() } : e)
          }
        }
        return acc
      }))
    } catch (err) {
      console.error("Failed to save ledger entry", err)
      // Rollback could be added here if needed
    }
  }

  const updateLedgerEntry = async (accountId: string, entryId: string, entry: Partial<LedgerEntry>) => {
    // 1. Optimistic update
    setAccounts(prev => prev.map((acc) => {
      if (acc.id === accountId) {
        const updatedLedger = acc.ledger.map(e => (e.id === entryId ? { ...e, ...entry } : e))
        const newBalance = updatedLedger.reduce((sum, e) => sum + (e.amount - e.discount + e.taxOrPaid - e.payment), 0)
        return { ...acc, balance: newBalance, ledger: updatedLedger }
      }
      return acc
    }))
    
    // 2. Server sync
    if (!entryId.startsWith("temp-")) {
      await serverUpdateLedgerEntry(entryId, entry)
    }
  }

  const deleteLedgerEntry = async (accountId: string, entryId: string) => {
    // 1. Optimistic update
    setAccounts(prev => prev.map((acc) => {
      if (acc.id === accountId) {
        const updatedLedger = acc.ledger.filter(e => e.id !== entryId)
        const newBalance = updatedLedger.reduce((sum, e) => sum + (e.amount - e.discount + e.taxOrPaid - e.payment), 0)
        return { ...acc, balance: newBalance, ledger: updatedLedger }
      }
      return acc
    }))
    
    // 2. Server sync
    if (!entryId.startsWith("temp-")) {
      await serverDeleteLedgerEntry(entryId)
    }
  }

  const addInvoice = async (inv: Omit<Invoice, "id" | "status">) => {
    const newId = Date.now().toString()
    setInvoices(prev => [...prev, { ...inv, id: newId, status: "pending" as const }])
    await serverAddInvoice(activeOrgId, { ...inv, id: newId, status: "pending" })
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
    await serverUpdateInvoice(id, updates)
  }

  const deleteInvoice = async (id: string) => {
    setInvoices(prev => prev.filter((i) => i.id !== id))
    await serverDeleteInvoice(id)
  }

  if (!isLoaded) return null // Or a loader

  const activeOrg = organizations.find(o => o.id === activeOrgId) || organizations[0] || { id: "abc-company", name: "ABC Company" }
  const organizationName = activeOrg.name

  return (
    <StoreContext.Provider value={{ 
      accounts, invoices, addAccount, updateAccount, deleteAccount, addLedgerEntry, updateLedgerEntry, deleteLedgerEntry, addInvoice, updateInvoice, deleteInvoice, 
    organizations, activeOrgId, activeOrg, addOrganization, updateOrganization, deleteOrganization,
    organization: organizationName, setOrganization: setActiveOrgId 
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}
