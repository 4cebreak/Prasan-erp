"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, ShieldCheck, Building2, KeyRound, Plus } from "lucide-react"
import { checkFreshInstall, serverAddOrganization, serverGetMasterPasswordHash, serverSetMasterPasswordHash, serverListOrganizations } from "@/app/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AuthContextType {
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function hashPassword(password: string): Promise<string> {
  // Check for secure context (crypto.subtle)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  }

  // Fallback for insecure contexts (e.g. accessing via IP on mobile over HTTP)
  return sha256Fallback(password)
}

/**
 * A lightweight SHA-256 implementation as a fallback for insecure contexts
 * where crypto.subtle is unavailable.
 */
function sha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount))
  }
  
  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  const lengthProperty = 'length'
  let i, j // Used as a counter across the whole file
  let result = ''

  const k: number[] = []
  const hash: number[] = []
  let primeCounter = 0
  const isComposite: { [key: number]: number } = {}
  
  for (i = 2; primeCounter < 64; i++) {
    if (!isComposite[i]) {
      for (j = i * i; j < 311; j += i) {
        isComposite[j] = 1
      }
      hash[primeCounter] = (mathPow(i, 1/2) * maxWord) | 0
      k[primeCounter++] = (mathPow(i, 1/3) * maxWord) | 0
    }
  }
  
  let ascii_padded = ascii + '\x80'
  while (ascii_padded[lengthProperty] % 64 - 56) ascii_padded += '\x00'
  
  const words: number[] = []
  const asciiBitLength = ascii[lengthProperty] * 8
  
  for (i = 0; i < ascii_padded[lengthProperty]; i++) {
    j = ascii_padded.charCodeAt(i)
    words[i >> 2] |= j << ((3 - i % 4) * 8)
  }
  
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0)
  words[words[lengthProperty]] = (asciiBitLength | 0)

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16)
    const oldHash = [...hash]
    hash.splice(8)
    
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2]
      const a = hash[0], e = hash[4]
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        )
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))
      
      hash.unshift((temp1 + temp2) | 0)
      hash[4] = (hash[4] + temp1) | 0
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }
  
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255
      result += (b < 16 ? '0' : '') + b.toString(16)
    }
  }
  return result
}


// ──────────────────────────────────────────────────────────────────
// SETUP WIZARD — shown only on completely fresh installs
// ──────────────────────────────────────────────────────────────────
function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [companyName, setCompanyName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFinish = async () => {
    if (password.length < 4) { setError("Password must be at least 4 characters."); return }
    if (password !== confirmPassword) { setError("Passwords do not match."); return }
    
    setIsSubmitting(true)
    setError("")
    try {
      // Store password hash
      const hashed = await hashPassword(password)
      
      // Try to get existing org or create new
      const orgId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      try {
        await serverAddOrganization(companyName.trim(), orgId, hashed)
      } catch (e) {
        // Org might already exist (orphaned install), try setting the hash directly
        await serverSetMasterPasswordHash(hashed)
      }
      
      localStorage.setItem("jeans_master_password_hash", hashed)
      localStorage.setItem("jeans_active_org", orgId)
      localStorage.setItem("jeans_setup_complete", "true")
      
      onComplete()
    } catch (err: any) {
      setError(err.message || "Setup failed.")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome to Prasan</h1>
          <p className="text-muted-foreground text-sm mt-1">Let&apos;s set up your business in 2 steps</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-xl shadow-black/10">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Your Company
                </h2>
                <p className="text-sm text-muted-foreground mt-1">What is the name of your business?</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Company Name</label>
                <Input
                  placeholder="e.g. Parasnath Jeans"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && companyName.trim()) setStep(2) }}
                  className="rounded-xl h-12 bg-muted border-0"
                  autoFocus
                />
              </div>
              <Button
                onClick={() => { if (companyName.trim()) setStep(2); else setError("Please enter a company name.") }}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold"
              >
                Continue →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Set Master Password
                </h2>
                <p className="text-sm text-muted-foreground mt-1">This password protects all your business data.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError("") }}
                      className="rounded-xl h-12 bg-muted border-0 pr-12"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleFinish() }}
                    className="rounded-xl h-12 bg-muted border-0"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2.5 font-medium">{error}</div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl flex-1">← Back</Button>
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="rounded-xl flex-[2] bg-primary hover:bg-primary/90 font-semibold"
                >
                  {isSubmitting ? "Setting up..." : "Launch Prasan →"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// LOGIN SCREEN — shown after setup is complete
// ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [storedHash, setStoredHash] = useState<string | null>(null)
  
  // Add Org modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPass, setNewPass] = useState("")
  const [newConfirm, setNewConfirm] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    serverListOrganizations().then(async orgs => {
      setOrganizations(orgs)
      if (orgs.length > 0) {
        const lastActive = localStorage.getItem("jeans_active_org")
        const activeId = (lastActive && orgs.find(o => o.id === lastActive)) ? lastActive : orgs[0].id
        setSelectedOrgId(activeId)
        
        // Check hash for the initial selected org
        const sHash = await serverGetMasterPasswordHash(activeId)
        setStoredHash(sHash)
        setIsSettingPassword(!sHash && !localStorage.getItem(`jeans_hash_${activeId}`))
      }
      setIsLoadingOrgs(false)
    })
  }, [])

  // Re-check hash when organization changes
  useEffect(() => {
    if (!selectedOrgId || isLoadingOrgs) return
    const checkHash = async () => {
      const localHash = localStorage.getItem(`jeans_hash_${selectedOrgId}`)
      if (localHash) {
        setStoredHash(localHash)
        setIsSettingPassword(false)
        return
      }
      const sHash = await serverGetMasterPasswordHash(selectedOrgId)
      setStoredHash(sHash)
      setIsSettingPassword(!sHash)
    }
    checkHash()
  }, [selectedOrgId])

  const handleLogin = async () => {
    if (!password.trim()) { setError("Please enter the master password"); return }
    
    setIsVerifying(true)
    setError("")

    const hashed = await hashPassword(password)
    
    if (isSettingPassword) {
      if (password !== confirmPassword) { setError("Passwords do not match."); setIsVerifying(false); return }
      if (password.length < 4) { setError("Password must be at least 4 characters."); setIsVerifying(false); return }
      
      await serverSetMasterPasswordHash(hashed, selectedOrgId)
      localStorage.setItem(`jeans_hash_${selectedOrgId}`, hashed)
      setStoredHash(hashed)
      setIsSettingPassword(false)
      sessionStorage.setItem("jeans_auth", "true")
      localStorage.setItem("jeans_active_org", selectedOrgId)
      onLogin()
      setIsVerifying(false)
      return
    }

    let currentHash = storedHash
    if (!currentHash) {
      currentHash = localStorage.getItem(`jeans_hash_${selectedOrgId}`)
    }
    
    if (!currentHash) {
      setError("No password configured. Please set a password.")
      setIsSettingPassword(true)
      setIsVerifying(false)
      return
    }

    if (hashed === currentHash) {
      // Sync local hash to server if not already there (for migration to DB)
      serverGetMasterPasswordHash(selectedOrgId).then(serverHash => {
        if (!serverHash) serverSetMasterPasswordHash(hashed, selectedOrgId)
      })
      
      localStorage.setItem("jeans_active_org", selectedOrgId)
      sessionStorage.setItem("jeans_auth", "true")
      onLogin()
    } else {
      setError("Incorrect password. Access denied.")
    }
    setIsVerifying(false)
  }

  const handleCreateNew = async () => {
    if (!newName.trim()) { setError("Business name is required"); return }
    if (newPass.length < 4) { setError("Password must be at least 4 characters"); return }
    if (newPass !== newConfirm) { setError("Passwords do not match"); return }
    
    setIsCreating(true)
    setError("")
    try {
      const hashed = await hashPassword(newPass)
      const newId = newName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      await serverAddOrganization(newName.trim(), newId, hashed)
      
      localStorage.setItem(`jeans_hash_${newId}`, hashed)
      localStorage.setItem("jeans_active_org", newId)
      sessionStorage.setItem("jeans_auth", "true")
      onLogin()
    } catch (err: any) {
      setError(err.message || "Failed to create business")
    }
    setIsCreating(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Prasan ERP</h1>
          <p className="text-muted-foreground text-sm mt-1">Enterprise Business Suite</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-xl shadow-black/10">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Secure Login
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Enter the master password to access your data.</p>
          </div>

          <div className="flex gap-2 items-end">
            {!isLoadingOrgs && organizations.length > 0 && (
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1.5 block text-primary font-bold">Select Organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full rounded-xl h-12 bg-muted border-0 px-3 text-foreground font-semibold focus:ring-2 focus:ring-primary outline-none"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-dashed border-primary text-primary hover:bg-primary/5">
                  <Plus className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Business</DialogTitle>
                  <DialogDescription>
                    Add a new business entity to Prasan ERP.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Business Name</label>
                    <Input 
                      placeholder="e.g. JS Manufacturing" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="rounded-xl bg-muted border-0 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Master Password</label>
                    <Input 
                      type="password"
                      placeholder="At least 4 characters" 
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="rounded-xl bg-muted border-0 h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <Input 
                      type="password"
                      placeholder="Repeat password" 
                      value={newConfirm}
                      onChange={(e) => setNewConfirm(e.target.value)}
                      className="rounded-xl bg-muted border-0 h-11"
                    />
                  </div>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl flex-1">Cancel</Button>
                  <Button onClick={handleCreateNew} disabled={isCreating} className="rounded-xl flex-[2]">
                    {isCreating ? "Creating..." : "Create & Launch"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {isSettingPassword ? "Create Master Password" : "Master Password"}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={isSettingPassword ? "Create password" : "Enter password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                onKeyDown={(e) => { if (e.key === "Enter" && !isSettingPassword) handleLogin() }}
                className="rounded-xl h-12 bg-muted border-0 pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isSettingPassword && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
                className="rounded-xl h-12 bg-muted border-0"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2.5 font-medium">{error}</div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isVerifying}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold"
          >
            {isVerifying ? "Verifying..." : (isSettingPassword ? "Initialize Business" : "Unlock Dashboard")}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// AUTH PROVIDER — orchestrates setup vs login vs authenticated
// ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isFreshInstall, setIsFreshInstall] = useState(false)

  useEffect(() => {
    async function check() {
      // Check session
      const auth = sessionStorage.getItem("jeans_auth")
      if (auth === "true") {
        setIsAuthenticated(true)
        setIsChecking(false)
        return
      }

      // Check setup state
      try {
        const fresh = await checkFreshInstall()
        if (fresh) {
          setIsFreshInstall(true)
        }
      } catch (e) {
        // DB might not be ready yet, fallback to checking localStorage
        const hasSetup = localStorage.getItem("jeans_setup_complete")
        if (!hasSetup) setIsFreshInstall(true)
      }
      
      setIsChecking(false)
    }
    check()
  }, [])

  const logout = () => {
    sessionStorage.removeItem("jeans_auth")
    setIsAuthenticated(false)
  }

  if (isChecking) return null

  if (isFreshInstall) {
    return (
      <SetupWizard onComplete={() => {
        setIsFreshInstall(false)
        sessionStorage.setItem("jeans_auth", "true")
        setIsAuthenticated(true)
      }} />
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
