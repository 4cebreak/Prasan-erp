"use client"

import { useState } from "react"
import { Search, Plus, FileText, Download, Edit2, Eye, MoreHorizontal, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react"
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
import { useStore, Invoice } from "@/lib/store"

export function InvoicesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, accounts, organization } = useStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  
  // New/Edit Invoice State
  const [invoiceNo, setInvoiceNo] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [agencyName, setAgencyName] = useState("")
  const [city, setCity] = useState("")
  const [transport, setTransport] = useState("")
  const [remarks, setRemarks] = useState("")
  const [marka, setMarka] = useState("")
  const [discount, setDiscount] = useState<number | "">("")
  const [taxes, setTaxes] = useState<number | "">("")
  
  const [items, setItems] = useState([{
    sno: 1, style: "", brandName: "", size: "", qty: 1, rate: 0, amount: 0
  }])

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.agencyName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openNewInvoice = () => {
    setEditingInvoiceId(null)
    setInvoiceNo(`INV-${String(invoices.length + 1).padStart(3, "0")}`)
    setCustomerName("")
    setAgencyName("")
    setCity("")
    setTransport("")
    setRemarks("")
    setMarka("")
    setItems([{ sno: 1, style: "", brandName: "", size: "", qty: 1, rate: 0, amount: 0 }])
    setDiscount("")
    setTaxes("")
    setIsDialogOpen(true)
  }

  const openEditInvoice = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id)
    setInvoiceNo(invoice.invoiceNo || "")
    setCustomerName(invoice.customerName)
    setAgencyName(invoice.agencyName || "")
    setCity(invoice.city || "")
    setTransport(invoice.transport || "")
    setRemarks(invoice.remarks || "")
    setMarka(invoice.marka || "")
    setItems(invoice.items)
    setDiscount(invoice.discount || "")
    setTaxes(invoice.taxes || "")
    setIsDialogOpen(true)
  }

  const handleAddItem = () => {
    setItems([...items, { sno: items.length + 1, style: "", brandName: "", size: "", qty: 1, rate: 0, amount: 0 }])
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items]
    const item = newItems[index] as any
    item[field] = value
    
    // Auto-calculate amount
    if (field === 'qty' || field === 'rate') {
      item.amount = (item.qty || 0) * (item.rate || 0)
    }
    setItems(newItems)
  }
  
  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    // reset sno
    newItems.forEach((item, i) => item.sno = i + 1)
    setItems(newItems)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
  const grandTotal = subtotal - (Number(discount) || 0) + (Number(taxes) || 0)

  const handleSaveInvoice = () => {
    if (customerName && invoiceNo && items.length > 0) {
      const invoiceData = {
        invoiceNo,
        customerName,
        agencyName,
        city,
        transport,
        remarks,
        marka,
        items,
        subtotal,
        discount: Number(discount) || 0,
        taxes: Number(taxes) || 0,
        grandTotal
      }

      if (editingInvoiceId) {
        updateInvoice(editingInvoiceId, invoiceData)
      } else {
        addInvoice({
          date: new Date().toISOString(),
          ...invoiceData
        })
      }
      setIsDialogOpen(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const getStatusConfig = (status: Invoice["status"]) => {
    switch (status) {
      case "paid": return { icon: CheckCircle, label: "Paid", className: "bg-accent/20 text-accent" }
      case "pending": return { icon: Clock, label: "Pending", className: "bg-warning/20 text-warning" }
      case "overdue": return { icon: XCircle, label: "Overdue", className: "bg-destructive/20 text-destructive" }
    }
  }

  const getPendingDaysColor = (dateString: string, status: Invoice["status"]) => {
    if (status === "paid") return "text-muted-foreground"
    const diffTime = new Date().getTime() - new Date(dateString).getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays >= 120) return "text-red-500 font-bold"
    if (diffDays >= 90) return "text-orange-500 font-bold"
    if (diffDays >= 60) return "text-yellow-500 font-bold"
    if (diffDays >= 30) return "text-blue-500 font-bold"
    return "text-muted-foreground"
  }

  const generatePDF = async (invoice: Invoice) => {
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default
    
    const doc = new jsPDF()
    const primaryColor = [16, 133, 252] as [number, number, number]
    
    // Header
    doc.setFontSize(28)
    doc.setTextColor(...primaryColor)
    doc.text(organization, 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text("Professional Business Suite", 14, 30)
    
    doc.setFontSize(20)
    doc.setTextColor(0, 0, 0)
    doc.text("INVOICE", 140, 22)

    doc.setFontSize(10)
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 140, 30)
    doc.text(`Date: ${formatDate(invoice.date)}`, 140, 36)
    
    let metaY = 42
    if (invoice.transport) { doc.text(`Transport: ${invoice.transport}`, 140, metaY); metaY+=6 }
    if (invoice.marka) { doc.text(`Marka: ${invoice.marka}`, 140, metaY); metaY+=6 }
    if (invoice.remarks) { doc.text(`Remarks: ${invoice.remarks}`, 140, metaY); metaY+=6 }

    // Bill To
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text("BILL TO:", 14, 46)
    
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(invoice.customerName, 14, 54)
    
    let bY = 60
    if (invoice.agencyName) { doc.text(`Agency: ${invoice.agencyName}`, 14, bY); bY+=6 }
    if (invoice.city) { doc.text(`City: ${invoice.city}`, 14, bY); bY+=6 }

    // Table
    const tableData = invoice.items.map(item => [
      item.sno, item.style, item.brandName, item.size, item.qty, item.rate, `Rs ${item.amount}`
    ])

    autoTable(doc, {
      startY: Math.max(bY, metaY) + 10,
      head: [['S.No', 'Style', 'Brand Name', 'Size', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor },
      foot: [
        ['', '', '', '', 'Subtotal', '', `Rs ${invoice.subtotal}`],
        ['', '', '', '', 'Discount', '', `-Rs ${invoice.discount}`],
        ['', '', '', '', 'Taxes', '', `+Rs ${invoice.taxes}`],
        ['', '', '', '', 'Grand Total', '', `Rs ${invoice.grandTotal}`],
      ],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    })

    const safeFilename = (invoice.invoiceNo || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_')
    
    // Explicit HTML5 strict local download to guarantee exact filename behavior:
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

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((sum, inv) => sum + inv.grandTotal, 0)
  const pendingAmount = invoices.filter((i) => i.status === "pending").reduce((sum, inv) => sum + inv.grandTotal, 0)

  // Autocomplete helpers
  const uniqueCustomers = Array.from(new Set(accounts.filter(a => a.type === "Direct Agent").map(a => a.name)))
  const uniqueAgencies = Array.from(new Set(accounts.filter(a => a.type === "Agency").map(a => a.name)))

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-accent">{formatCurrency(paidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary" />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25" onClick={openNewInvoice}>
              <Plus className="w-5 h-5 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-border bg-card w-[95vw] sm:max-w-[95vw] lg:max-w-[90vw] xl:max-w-7xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingInvoiceId ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
              <DialogDescription>Fill out the party details and line items below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 border border-border/50 p-4 rounded-xl">
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">Customer Name</label>
                  <Input list="customers" placeholder="e.g. MTEENZ RETAIL PVT LTD" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                  <datalist id="customers">
                    {uniqueCustomers.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">Agency Name</label>
                  <Input list="agencies" placeholder="e.g. ABC AGENCIES" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                  <datalist id="agencies">
                    {uniqueAgencies.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">Invoice Number</label>
                  <Input placeholder="INV-001" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                </div>
                <div className="col-span-1 lg:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">City</label>
                  <Input placeholder="e.g. Mumbai" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                </div>
                <div className="col-span-1 lg:col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">Transport</label>
                  <Input placeholder="e.g. VRL Logistics" value={transport} onChange={(e) => setTransport(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                </div>

                <div className="col-span-1 lg:col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">Remarks</label>
                  <Input placeholder="Any additional notes" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                </div>
                <div className="col-span-1 lg:col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">Marka</label>
                  <Input placeholder="e.g. MRK-009" value={marka} onChange={(e) => setMarka(e.target.value)} className="rounded-lg h-10 bg-muted border-0" />
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left w-12">S.No</th>
                      <th className="p-3 text-left">Style</th>
                      <th className="p-3 text-left w-48">Brand Name</th>
                      <th className="p-3 text-left w-24">Size</th>
                      <th className="p-3 text-left w-24">Qty</th>
                      <th className="p-3 text-left w-28">Rate (₹)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t border-border/50">
                        <td className="p-2 text-center text-muted-foreground">{item.sno}</td>
                        <td className="p-2"><Input className="h-9 border-0 bg-muted/50 rounded-lg text-sm min-w-24" value={item.style ?? ''} onChange={e => handleItemChange(idx, 'style', e.target.value)} /></td>
                        <td className="p-2"><Input className="h-9 border-0 bg-muted/50 rounded-lg text-sm min-w-32" value={item.brandName ?? ''} onChange={e => handleItemChange(idx, 'brandName', e.target.value)} /></td>
                        <td className="p-2"><Input className="h-9 border-0 bg-muted/50 rounded-lg text-sm min-w-20" value={item.size ?? ''} onChange={e => handleItemChange(idx, 'size', e.target.value)} /></td>
                        <td className="p-2"><Input type="number" className="h-9 border-0 bg-muted/50 rounded-lg text-sm min-w-16" value={item.qty ?? ''} onChange={e => handleItemChange(idx, 'qty', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                        <td className="p-2"><Input type="number" className="h-9 border-0 bg-muted/50 rounded-lg text-sm min-w-20" value={item.rate ?? ''} onChange={e => handleItemChange(idx, 'rate', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                        <td className="p-2 text-right font-medium min-w-24">{formatCurrency(item.amount)}</td>
                        <td className="p-2 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" className="w-full border-dashed rounded-xl" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item Row
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Items Qty:</span>
                    <span className="font-medium">{items.reduce((sum, item) => sum + (item.qty || 0), 0)} pcs</span>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm input-group">
                    <span className="text-muted-foreground mr-4">Discount (₹):</span>
                    <Input type="number" className="h-8 w-32 border-0 bg-background text-right" value={discount ?? ''} onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                  <div className="flex justify-between items-center text-sm input-group">
                    <span className="text-muted-foreground mr-4">Taxes (₹):</span>
                    <Input type="number" className="h-8 w-32 border-0 bg-background text-right" value={taxes ?? ''} onChange={(e) => setTaxes(e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="font-medium">Grand Total:</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSaveInvoice} disabled={!customerName || !invoiceNo} className="rounded-xl bg-primary hover:bg-primary/90">
                {editingInvoiceId ? "Save Changes" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoices Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Invoice</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Customer & Agency</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Total Quantity</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Grand Total</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => {
                const statusConfig = getStatusConfig(invoice.status)
                const StatusIcon = statusConfig.icon
                const totalQty = invoice.items.reduce((s, i) => s + (i.qty || 0), 0)
                return (
                  <tr key={invoice.id} className={cn("border-b border-border/50 hover:bg-muted/30 transition-colors", index === filteredInvoices.length - 1 && "border-b-0")}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{invoice.invoiceNo}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-foreground tracking-tight">{invoice.customerName}</span>
                        {invoice.agencyName && <span className="text-xs text-muted-foreground uppercase">{invoice.agencyName}</span>}
                      </div>
                    </td>
                    <td className="p-4"><span className={getPendingDaysColor(invoice.date, invoice.status)}>{formatDate(invoice.date)}</span></td>
                    <td className="p-4">
                      <Badge className={cn("rounded-lg px-3 py-1 font-medium border-0 gap-1", statusConfig.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-muted-foreground font-medium">{totalQty} pcs</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-lg text-foreground">{formatCurrency(invoice.grandTotal)}</span>
                    </td>
                    <td className="p-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="w-5 h-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem className="rounded-lg gap-2" onClick={() => openEditInvoice(invoice)}>
                            <Edit2 className="w-4 h-4" /> Edit Invoice
                          </DropdownMenuItem>
                          {invoice.status !== "paid" ? (
                            <DropdownMenuItem className="rounded-lg gap-2 text-accent font-medium bg-accent/5 hover:bg-accent/10" onClick={() => updateInvoice(invoice.id, { status: "paid" })}>
                              <CheckCircle className="w-4 h-4" /> Mark as Paid
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="rounded-lg gap-2 text-warning font-medium bg-warning/5 hover:bg-warning/10" onClick={() => updateInvoice(invoice.id, { status: "pending" })}>
                              <Clock className="w-4 h-4" /> Mark as Pending
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="rounded-lg gap-2" onClick={() => generatePDF(invoice)}>
                            <Download className="w-4 h-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 text-destructive" onClick={() => deleteInvoice(invoice.id)}>
                            <Trash2 className="w-4 h-4" /> Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No invoices found</p>
          </div>
        )}

        <div className="border-t border-border bg-muted/30 p-4">
          <span className="text-sm text-muted-foreground">Showing {filteredInvoices.length} of {invoices.length} invoices</span>
        </div>
      </div>
    </div>
  )
}
