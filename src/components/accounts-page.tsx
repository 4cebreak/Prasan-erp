"use client"

import { useState } from "react"
import { Search, Plus, Users, ArrowUpRight, ArrowDownRight, Edit2, FileText, Trash2, MoreHorizontal, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useStore, Account, LedgerEntry } from "@/lib/store"

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Google Pay", "NEFT/RTGS"]

export function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, addLedgerEntry, updateLedgerEntry, deleteLedgerEntry, organization } = useStore()
  const [searchQuery, setSearchQuery] = useState("")

  // Account form state
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<"Direct Agent" | "Agency">("Direct Agent")
  const [newAccountStation, setNewAccountStation] = useState("")

  // Ledger state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [ledgerSearch, setLedgerSearch] = useState("")
  
  // Empty line states for ledger
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [entryParty, setEntryParty] = useState("")
  const [entryStation, setEntryStation] = useState("")
  const [entryAmount, setEntryAmount] = useState<number | "">("")
  const [entryDiscount, setEntryDiscount] = useState<number | "">("")
  const [entryTaxOrPaid, setEntryTaxOrPaid] = useState<number | "">("")
  const [entryItems, setEntryItems] = useState("")
  const [entryPayment, setEntryPayment] = useState<number | "">("")
  
  const [entryType, setEntryType] = useState<"bill" | "payment">("bill")
  const [entryPaymentMode, setEntryPaymentMode] = useState<string>("Cash")
  
  // Tracking which ledger entry is being edited
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.station.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openNewAccount = () => {
    setEditingAccountId(null)
    setNewAccountName("")
    setNewAccountType("Direct Agent")
    setNewAccountStation("")
    setIsAccountDialogOpen(true)
  }

  const openEditAccount = (account: Account) => {
    setEditingAccountId(account.id)
    setNewAccountName(account.name)
    setNewAccountType(account.type)
    setNewAccountStation(account.station)
    setIsAccountDialogOpen(true)
  }

  const handleSaveAccount = () => {
    if (newAccountName) {
      if (editingAccountId) {
        updateAccount(editingAccountId, {
          name: newAccountName,
          type: newAccountType,
          station: newAccountStation
        })
      } else {
        addAccount({ name: newAccountName, type: newAccountType, station: newAccountStation })
      }
      setIsAccountDialogOpen(false)
    }
  }

  const resetEntryForm = () => {
    setEditingEntryId(null)
    setEntryDate(new Date().toISOString().split("T")[0])
    setEntryParty("")
    setEntryStation("")
    setEntryAmount("")
    setEntryDiscount("")
    setEntryTaxOrPaid("")
    setEntryItems("")
    setEntryPayment("")
    setEntryType("bill")
    setEntryPaymentMode("Cash")
  }

  const openEditLedgerEntry = (entry: LedgerEntry) => {
    setEditingEntryId(entry.id)
    setEntryDate(entry.date)
    setEntryParty(entry.party)
    setEntryStation(entry.station)
    setEntryAmount(entry.amount ?? "")
    setEntryDiscount(entry.discount ?? "")
    setEntryTaxOrPaid(entry.taxOrPaid ?? "")
    setEntryItems(entry.items)
    setEntryPayment(entry.payment ?? "")
    setEntryType(entry.type || "bill")
    setEntryPaymentMode(entry.paymentMode || "Cash")
  }

  const currentNetAmount = (Number(entryAmount) || 0) - (Number(entryDiscount) || 0) + (Number(entryTaxOrPaid) || 0)

  const handleSaveLedgerEntry = () => {
    if (!selectedAccount) return

    const entryData: Omit<LedgerEntry, "id"> = {
      date: entryDate,
      party: entryParty,
      station: entryStation,
      amount: Number(entryAmount) || 0,
      discount: Number(entryDiscount) || 0,
      taxOrPaid: Number(entryTaxOrPaid) || 0,
      netAmount: currentNetAmount,
      items: entryItems,
      payment: Number(entryPayment) || 0,
      type: entryType,
      paymentMode: entryType === "payment" ? entryPaymentMode : undefined
    }

    if (editingEntryId) {
      updateLedgerEntry(selectedAccount.id, editingEntryId, entryData)
    } else {
      addLedgerEntry(selectedAccount.id, entryData)
    }

    // Immediately update local UI state so the dialog displays real-time before React batch
    setSelectedAccount(prev => {
      if (!prev) return prev
      const isUpdating = editingEntryId !== null
      const diffBalance = isUpdating 
        ? entryData.netAmount - entryData.payment - (prev.ledger.find(i=>i.id===editingEntryId)?.netAmount || 0) + (prev.ledger.find(i=>i.id===editingEntryId)?.payment || 0)
        : entryData.netAmount - entryData.payment

      return {
        ...prev,
        balance: prev.balance + diffBalance,
        ledger: isUpdating ? prev.ledger.map(e => e.id===editingEntryId ? {id: e.id, ...entryData} : e) : [...prev.ledger, { id: "temp", ...entryData }]
      }
    })
    
    resetEntryForm()
  }

  const handleDeleteLedgerEntry = (entryId: string) => {
    if (!selectedAccount) return
    deleteLedgerEntry(selectedAccount.id, entryId)
    setSelectedAccount(prev => {
      if (!prev) return prev
      const target = prev.ledger.find(e => e.id === entryId)
      if (!target) return prev
      return {
        ...prev,
        balance: prev.balance - (target.netAmount - target.payment),
        ledger: prev.ledger.filter(e => e.id !== entryId)
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(amount))
  }

  const totalReceivable = accounts.filter((a) => a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
  const totalPayable = accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0)

  // Sort and filter ledger
  const sortedLedger = selectedAccount?.ledger
    .slice()
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(entry => 
      !ledgerSearch || 
      entry.party.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      entry.date.includes(ledgerSearch) ||
      entry.items?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      entry.station.toLowerCase().includes(ledgerSearch.toLowerCase())
    ) || []

  const totalLedgerAmount = sortedLedger.reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalLedgerDiscount = sortedLedger.reduce((sum, e) => sum + (e.discount || 0), 0)
  const totalLedgerTax = sortedLedger.reduce((sum, e) => sum + (e.taxOrPaid || 0), 0)
  const totalLedgerNet = sortedLedger.reduce((sum, e) => sum + (e.netAmount || 0), 0)
  const totalLedgerPayment = sortedLedger.reduce((sum, e) => sum + (e.payment || 0), 0)

  const generateLedgerPDF = async () => {
    if (!selectedAccount) return

    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default
    
    const doc = new jsPDF()
    const primaryColor = [16, 133, 252] as [number, number, number]
    
    // Header
    doc.setFontSize(28)
    doc.setTextColor(...primaryColor)
    doc.text(organization || "ABC Company", 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Ledger Statement: ${selectedAccount.name}`, 14, 30)
    if (selectedAccount.station) {
      doc.text(`Station: ${selectedAccount.station}`, 14, 36)
    }

    doc.setFontSize(20)
    doc.setTextColor(0, 0, 0)
    doc.text("LEDGER", 140, 22)

    doc.setFontSize(10)
    const today = new Date().toLocaleDateString("en-IN")
    doc.text(`Generated: ${today}`, 140, 30)

    // Format Data matching screenshot strictly
    const tableData = sortedLedger.map(entry => {
      const partyStr = entry.type === "payment" && entry.paymentMode 
        ? `${entry.paymentMode} - ${entry.party}` 
        : entry.party || ""
        
      return [
        entry.date,
        partyStr,
        entry.amount ? formatCurrency(entry.amount).replace('₹','') : "",
        entry.discount ? `-${formatCurrency(entry.discount).replace('₹','')}` : "",
        entry.taxOrPaid ? formatCurrency(entry.taxOrPaid).replace('₹','') : "",
        entry.netAmount ? formatCurrency(entry.netAmount).replace('₹','') : "",
        entry.items || "",
        entry.payment ? formatCurrency(entry.payment).replace('₹','') : ""
      ]
    })

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Party', 'Amount', 'Discount', 'Tax/Paid', 'Net Amount', 'ITEMS', 'Payment']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.5, lineColor: [0, 0, 0] },
      bodyStyles: { textColor: [0, 0, 0], lineColor: [0, 0, 0] },
      columnStyles: {
        0: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        7: { halign: 'right' }
      },
      foot: [
        [
          '', 
          '', 
          totalLedgerAmount ? formatCurrency(totalLedgerAmount).replace('₹','') : "", 
          totalLedgerDiscount ? `-${formatCurrency(totalLedgerDiscount).replace('₹','')}` : "", 
          totalLedgerTax ? formatCurrency(totalLedgerTax).replace('₹','') : "", 
          totalLedgerNet ? formatCurrency(totalLedgerNet).replace('₹','') : "", 
          '', 
          totalLedgerPayment ? formatCurrency(totalLedgerPayment).replace('₹','') : ""
        ],
        [
          { content: 'NET BALANCE:', colSpan: 4, styles: { halign: 'center', fontSize: 16, fontStyle: 'bold' } },
          { content: formatCurrency(Math.abs(selectedAccount.balance)).replace('₹',''), colSpan: 4, styles: { halign: 'right', fontSize: 16, fontStyle: 'bold' } }
        ]
      ],
      footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] }
    })

    const safeFilename = `${selectedAccount.name}_Ledger`.replace(/[^a-zA-Z0-9_-]/g, '_')
    
    const blob = doc.output("blob")
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${safeFilename}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6 flex-1">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <ArrowUpRight className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receivable (To Collect)</p>
              <p className="text-2xl font-bold text-accent">{formatCurrency(totalReceivable)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10">
              <ArrowDownRight className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payable (To Give)</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalPayable)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary" />
        </div>

        <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" onClick={openNewAccount}>
              <Plus className="w-5 h-5 mr-2" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-border bg-card w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingAccountId ? "Edit Account" : "Create New Account"}</DialogTitle>
              <DialogDescription>Add or update an agency or direct agent in your CRM.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Name</label>
                <Input placeholder="e.g. Customer Name" value={newAccountName ?? ''} onChange={(e) => setNewAccountName(e.target.value)} className="rounded-xl h-12 bg-muted border-0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Station / Location</label>
                <Input placeholder="e.g. Location Code" value={newAccountStation ?? ''} onChange={(e) => setNewAccountStation(e.target.value)} className="rounded-xl h-12 bg-muted border-0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Type</label>
                <div className="flex gap-2">
                  {(["Direct Agent", "Agency"] as const).map((type) => (
                    <Button key={type} type="button" variant={newAccountType === type ? "default" : "outline"} onClick={() => setNewAccountType(type)} className={cn("flex-1 rounded-xl h-12", newAccountType === type ? "bg-primary" : "bg-transparent")}>
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSaveAccount} className="rounded-xl bg-primary hover:bg-primary/90">
                {editingAccountId ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground w-1/3">Account Details</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Net Balance</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account, index) => (
                <tr key={account.id} className={cn("border-b border-border/50 hover:bg-muted/30 transition-colors", index === filteredAccounts.length - 1 && "border-b-0")}>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground tracking-tight">{account.name}</span>
                      <span className="text-sm text-muted-foreground">{account.station}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className={cn("rounded-md px-2 py-1 font-medium", account.type === "Agency" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>
                      {account.type}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn("font-bold text-lg font-mono", account.balance > 0 ? "text-accent" : account.balance < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {account.balance > 0 ? "+" : account.balance < 0 ? "-" : ""}
                        {formatCurrency(account.balance)}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {account.balance > 0 ? "Receivable" : account.balance < 0 ? "Payable" : "Settled"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="w-5 h-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedAccount(account); resetEntryForm(); }} className="rounded-lg gap-2 cursor-pointer text-primary">
                              <FileText className="w-4 h-4" /> View Ledger
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] lg:max-w-[90vw] xl:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl">
                            <div className="p-4 md:p-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                              <DialogHeader>
                                <DialogTitle className="text-2xl flex flex-wrap items-center gap-3">
                                  {selectedAccount?.name}
                                  <Badge className="font-normal">{selectedAccount?.type}</Badge>
                                </DialogTitle>
                                <DialogDescription className="text-sm mt-1">{selectedAccount?.station}</DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:flex-none">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input placeholder="Filter by Party, Date..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} className="pl-9 h-10 w-full sm:w-64 rounded-xl bg-background border-border" />
                                </div>
                                <Button onClick={generateLedgerPDF} variant="outline" className="h-10 px-3 sm:px-4 rounded-xl border-dashed shrink-0 hover:bg-muted">
                                  <Download className="w-4 h-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Export PDF</span>
                                </Button>
                              </div>
                            </div>

                            {/* Ledger Table */}
                            <div className="flex-1 overflow-x-auto min-h-[400px]">
                              <table className="w-full text-sm min-w-[1000px]">
                                <thead className="bg-muted sticky top-0 z-10 shadow-sm border-b border-border">
                                  <tr>
                                    <th className="p-3 text-left font-semibold text-foreground min-w-32">DATE</th>
                                    <th className="p-3 text-left font-semibold text-foreground min-w-40">INVOICE NO / PARTY</th>
                                    <th className="p-3 text-left font-semibold text-foreground min-w-32">STATION</th>
                                    <th className="p-3 text-right font-semibold text-foreground min-w-28">AMOUNT</th>
                                    <th className="p-3 text-right font-semibold text-foreground min-w-24">DISCOUNT</th>
                                    <th className="p-3 text-right font-semibold text-foreground min-w-24">Tax/Paid</th>
                                    <th className="p-3 text-right font-semibold text-foreground min-w-32">NET AMOUNT</th>
                                    <th className="p-3 text-left font-semibold text-foreground min-w-32">ITEMS</th>
                                    <th className="p-3 text-right font-semibold text-foreground min-w-32">PAYMENT</th>
                                    <th className="p-3 text-center min-w-[70px]"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedLedger.map((entry, idx) => (
                                    <tr key={idx} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                      <td className="p-3 font-mono text-xs">{entry.date}</td>
                                      <td className="p-3 flex flex-col">
                                        <span>{entry.party}</span>
                                        {entry.type === "payment" && entry.paymentMode && (
                                          <span className="text-[10px] uppercase text-accent font-semibold">{entry.paymentMode}</span>
                                        )}
                                      </td>
                                      <td className="p-3">{entry.station}</td>
                                      <td className="p-3 text-right font-medium">{entry.amount ? formatCurrency(entry.amount) : "-"}</td>
                                      <td className="p-3 text-right text-destructive">{entry.discount ? `-${formatCurrency(entry.discount)}` : "-"}</td>
                                      <td className="p-3 text-right text-warning">{entry.taxOrPaid ? `+${formatCurrency(entry.taxOrPaid)}` : "-"}</td>
                                      <td className="p-3 text-right font-bold">{entry.netAmount ? formatCurrency(entry.netAmount) : "-"}</td>
                                      <td className="p-3 text-muted-foreground">{entry.items || "-"}</td>
                                      <td className="p-3 text-right text-accent font-medium">{entry.payment ? formatCurrency(entry.payment) : "-"}</td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditLedgerEntry(entry)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLedgerEntry(entry.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  
                                  {/* Subtotals Row */}
                                  {sortedLedger.length > 0 && (
                                    <tr className="bg-muted/40 font-semibold border-b border-border text-xs uppercase tracking-wider">
                                      <td className="p-3 text-muted-foreground" colSpan={3}>Subtotals</td>
                                      <td className="p-3 text-right">{totalLedgerAmount ? formatCurrency(totalLedgerAmount) : "-"}</td>
                                      <td className="p-3 text-right text-destructive">{totalLedgerDiscount ? formatCurrency(totalLedgerDiscount) : "-"}</td>
                                      <td className="p-3 text-right text-warning">{totalLedgerTax ? formatCurrency(totalLedgerTax) : "-"}</td>
                                      <td className="p-3 text-right">{totalLedgerNet ? formatCurrency(totalLedgerNet) : "-"}</td>
                                      <td className="p-3"></td>
                                      <td className="p-3 text-right text-accent">{totalLedgerPayment ? formatCurrency(totalLedgerPayment) : "-"}</td>
                                      <td className="p-3"></td>
                                    </tr>
                                  )}

                                  {/* Input Row for New/Edit */}
                                  <tr className="border-t border-border bg-muted/80">
                                    <td colSpan={10} className="p-3">
                                      <div className="flex flex-wrap gap-4 items-center">
                                        <span className="text-sm font-semibold text-foreground">Entry Controls:</span>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant={entryType === "bill" ? "default" : "outline"} onClick={() => setEntryType("bill")} className="h-8 text-xs rounded-lg">Bill</Button>
                                          <Button size="sm" variant={entryType === "payment" ? "default" : "outline"} onClick={() => setEntryType("payment")} className="h-8 text-xs rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">Payment</Button>
                                        </div>
                                        {entryType === "payment" && (
                                          <div className="flex items-center gap-2 ml-4">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase">Mode:</span>
                                            <Input placeholder="e.g. Cash, Cheque" className="h-8 w-32 text-xs bg-background rounded-lg border-border" value={entryPaymentMode ?? ''} onChange={(e) => setEntryPaymentMode(e.target.value)} />
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>

                                  <tr className={cn("border-t-2 border-primary/20", editingEntryId ? "bg-primary/5" : "bg-muted/10")}>
                                    <td className="p-2"><Input type="date" value={entryDate ?? ''} onChange={(e) => setEntryDate(e.target.value)} className="h-9 w-32 text-xs" /></td>
                                    <td className="p-2">
                                      <Input placeholder="Inv No / Name" value={entryParty ?? ''} onChange={(e) => setEntryParty(e.target.value)} className="h-9 w-full min-w-32 text-xs" />
                                    </td>
                                    <td className="p-2"><Input placeholder="Station" value={entryStation ?? ''} onChange={(e) => setEntryStation(e.target.value)} className="h-9 w-full min-w-24 text-xs" /></td>
                                    <td className="p-2"><Input type="number" placeholder="₹" value={entryAmount ?? ''} onChange={(e) => setEntryAmount(e.target.value === '' ? '' : Number(e.target.value))} className="h-9 w-full min-w-24 text-right text-xs" /></td>
                                    <td className="p-2"><Input type="number" placeholder="₹" value={entryDiscount ?? ''} onChange={(e) => setEntryDiscount(e.target.value === '' ? '' : Number(e.target.value))} className="h-9 w-full min-w-20 text-right text-xs" /></td>
                                    <td className="p-2"><Input type="number" placeholder="₹" value={entryTaxOrPaid ?? ''} onChange={(e) => setEntryTaxOrPaid(e.target.value === '' ? '' : Number(e.target.value))} className="h-9 w-full min-w-20 text-right text-xs" /></td>
                                    <td className="p-2 text-right font-bold px-4">{currentNetAmount ? formatCurrency(currentNetAmount) : "-"}</td>
                                    <td className="p-2"><Input placeholder="" value={entryItems ?? ''} onChange={(e) => setEntryItems(e.target.value)} className="h-9 w-full min-w-24 text-xs" /></td>
                                    <td className="p-2"><Input type="number" placeholder="₹" value={entryPayment ?? ''} onChange={(e) => setEntryPayment(e.target.value === '' ? '' : Number(e.target.value))} className="h-9 w-full min-w-24 text-right text-xs" /></td>
                                    <td className="p-2 text-center">
                                      <div className="flex flex-col gap-1 items-center">
                                        <Button size="sm" onClick={handleSaveLedgerEntry} className="h-8 text-xs font-semibold px-2 bg-primary">
                                          {editingEntryId ? "Save" : "Add"}
                                        </Button>
                                        {editingEntryId && (
                                          <Button variant="ghost" size="sm" onClick={resetEntryForm} className="h-6 text-[10px]">Cancel</Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="p-4 md:p-6 border-t border-border bg-card">
                              <div className="flex justify-end items-center gap-6">
                                <span className="text-xl font-medium text-foreground tracking-tight">NET BALANCE</span>
                                <span className={cn(
                                  "text-3xl md:text-4xl font-bold font-mono tracking-tight",
                                  (selectedAccount?.balance || 0) > 0 ? "text-accent" : (selectedAccount?.balance || 0) < 0 ? "text-destructive" : "text-foreground"
                                )}>
                                  ₹ {Math.abs(selectedAccount?.balance || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <DropdownMenuItem className="rounded-lg gap-2" onClick={() => openEditAccount(account)}>
                          <Edit2 className="w-4 h-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg gap-2 text-destructive" onClick={() => deleteAccount(account.id)}>
                          <Trash2 className="w-4 h-4" /> Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No accounts found</p>
          </div>
        )}
      </div>
    </div>
  )
}
