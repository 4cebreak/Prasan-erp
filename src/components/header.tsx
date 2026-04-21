"use client"

import { useState } from "react"
import { Bell, Menu, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useStore } from "@/lib/store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { organization, organizations, setOrganization, addOrganization } = useStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")

  const handleAddOrg = () => {
    if (newOrgName.trim()) {
      addOrganization(newOrgName.trim())
      setNewOrgName("")
      setIsAddOpen(false)
    }
  }

  const abbr = organization.substring(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-xl"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 sm:gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold tracking-tight outline-none cursor-pointer text-sm sm:text-base">
            <span className="hidden min-[400px]:inline">{organization}</span>
            <span className="min-[400px]:hidden">{abbr}</span>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-48">
            {organizations.map(org => (
              <DropdownMenuItem key={org.id} onClick={() => setOrganization(org.id)} className="font-medium cursor-pointer py-2">
                {org.name}
              </DropdownMenuItem>
            ))}
            <div className="h-px bg-border my-1" />
            <DropdownMenuItem onClick={() => setIsAddOpen(true)} className="font-medium cursor-pointer py-2 text-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Company</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-1.5 block">Company Name</label>
              <Input 
                placeholder="e.g. Acme Corp" 
                value={newOrgName} 
                onChange={(e) => setNewOrgName(e.target.value)} 
                className="rounded-xl h-12 bg-muted border-0"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddOrg() }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddOrg} disabled={!newOrgName.trim()} className="rounded-xl bg-primary hover:bg-primary/90">
                Create Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
