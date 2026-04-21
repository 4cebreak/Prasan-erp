"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, ShieldCheck, Building2, KeyRound } from "lucide-react"
import { checkFreshInstall, serverAddOrganization } from "@/app/actions"

interface AuthContextType {
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
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
      // Create the first organization
      const orgId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      await serverAddOrganization(companyName.trim(), orgId)
      
      // Store password hash
      const hashed = await hashPassword(password)
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

  const handleLogin = async () => {
    if (!password.trim()) { setError("Please enter the master password"); return }
    
    setIsVerifying(true)
    setError("")

    const hashed = await hashPassword(password)
    const storedHash = localStorage.getItem("jeans_master_password_hash")
    
    if (!storedHash) {
      setError("No password configured. Please run setup again.")
      setIsVerifying(false)
      return
    }

    if (hashed === storedHash) {
      sessionStorage.setItem("jeans_auth", "true")
      onLogin()
    } else {
      setError("Incorrect password. Access denied.")
    }
    setIsVerifying(false)
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

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Master Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError("") }}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
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

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-2.5 font-medium">{error}</div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isVerifying}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-base font-semibold"
          >
            {isVerifying ? "Verifying..." : "Unlock Dashboard"}
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

      // Check if this is a fresh install (no orgs in DB AND no password set)
      try {
        const fresh = await checkFreshInstall()
        const hasPassword = localStorage.getItem("jeans_master_password_hash")
        if (fresh && !hasPassword) {
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
