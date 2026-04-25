"use server"

import { prisma } from "@/lib/prisma"

export async function checkFreshInstall() {
  const count = await prisma.organization.count()
  return count === 0
}

// Types to match the frontend shape coming from localStorage
type LegacyOrg = { id: string, name: string, gstNumber?: string, panNumber?: string, address?: string, city?: string, state?: string }
type LegacyAccount = { id: string, name: string, type: string, station: string, balance: number, ledger: any[] }
type LegacyInvoice = { id: string, invoiceNo: string, date: string, customerName: string, agencyName: string, city?: string, transport?: string, remarks?: string, marka?: string, items: any[], subtotal: number, discount: number, taxes: number, grandTotal: number, status: string }

export async function migrateLegacyData(payload: {
  organizations: LegacyOrg[],
  parasnathAccounts: LegacyAccount[],
  parasnathInvoices: LegacyInvoice[],
  jsAccounts: LegacyAccount[],
  jsInvoices: LegacyInvoice[]
}) {
  try {
    console.log("Starting Migration Engine...")

    // 1. Insert Organizations safely
    for (const org of payload.organizations) {
      await prisma.organization.upsert({
        where: { id: org.id },
        update: { name: org.name },
        create: {
          id: org.id,
          name: org.name,
          gstNumber: org.gstNumber,
          panNumber: org.panNumber,
          address: org.address,
          city: org.city,
          state: org.state
        }
      })
    }

    // Helper to migrate accounts and ledgers
    const migrateAccounts = async (orgId: string, accounts: LegacyAccount[]) => {
      for (const acc of accounts) {
        const createdAcc = await prisma.account.upsert({
          where: { id: acc.id },
          update: { name: acc.name, type: acc.type, station: acc.station, balance: acc.balance },
          create: {
            id: acc.id,
            name: acc.name,
            type: acc.type,
            station: acc.station,
            balance: acc.balance,
            orgId: orgId
          }
        })
        
        // Migrate ledgers inside this account
        for (const entry of acc.ledger) {
          await prisma.ledgerEntry.upsert({
            where: { id: entry.id },
            update: {},
            create: {
              id: entry.id,
              date: new Date(entry.date),
              party: entry.party,
              station: entry.station,
              amount: entry.amount || 0,
              discount: entry.discount || 0,
              taxOrPaid: entry.taxOrPaid || 0,
              netAmount: entry.netAmount || 0,
              items: entry.items || "",
              payment: entry.payment || 0,
              type: entry.type || "bill",
              paymentMode: entry.paymentMode,
              accountId: createdAcc.id
            }
          })
        }
      }
    }

    // Helper to migrate invoices
    const migrateInvoices = async (orgId: string, invoices: LegacyInvoice[]) => {
      for (const inv of invoices) {
        const createdInv = await prisma.invoice.upsert({
          where: { id: inv.id },
          update: { },
          create: {
            id: inv.id,
            invoiceNo: inv.invoiceNo || "N/A",
            date: new Date(inv.date),
            customerName: inv.customerName,
            agencyName: inv.agencyName,
            city: inv.city,
            transport: inv.transport,
            remarks: inv.remarks,
            marka: inv.marka,
            subtotal: inv.subtotal || 0,
            discount: inv.discount || 0,
            taxes: inv.taxes || 0,
            grandTotal: inv.grandTotal || 0,
            status: inv.status || "pending",
            orgId: orgId
          }
        })

        for (const item of inv.items) {
          await prisma.itemRow.upsert({
            where: { id: item.id || Math.random().toString() },
            update: {},
            create: {
              sno: item.sno || 1,
              style: item.style,
              brandName: item.brandName,
              size: item.size,
              qty: item.qty || 0,
              rate: item.rate || 0,
              amount: item.amount || 0,
              invoiceId: createdInv.id
            }
          })
        }
      }
    }

    // A. Migrate ABC Company Context
    if (payload.organizations.find(o => o.id === "abc-company")) {
      await migrateAccounts("abc-company", payload.parasnathAccounts)
      await migrateInvoices("abc-company", payload.parasnathInvoices)
    }

    // B. Migrate XYZ Agencies Context
    if (payload.organizations.find(o => o.id === "xyz-agencies")) {
      await migrateAccounts("xyz-agencies", payload.jsAccounts)
      await migrateInvoices("xyz-agencies", payload.jsInvoices)
    }

    return { success: true }
  } catch (err: any) {
    console.error("Migration fatal error!", err)
    return { success: false, error: err.message }
  }
}

// -------------------------------------------------------------------------------- //
// LIVE DATA ACTIONS & REPLACEMENTS
// -------------------------------------------------------------------------------- //

export async function fetchStoreContext(orgId: string) {
  const organizations = await prisma.organization.findMany()
  const activeOrg = organizations.find((o) => o.id === orgId) || organizations[0]

  if (!activeOrg) return { organizations: [], accounts: [], invoices: [] }

  const accounts = await prisma.account.findMany({
    where: { orgId: activeOrg.id },
    include: { ledger: true }
  })

  // We limit invoices here to the latest 500 locally so browser cache doesn't blow up anymore.
  const invoices = await prisma.invoice.findMany({
    where: { orgId: activeOrg.id },
    include: { items: true },
    orderBy: { date: 'desc' },
    take: 500
  })

  return { organizations, accounts, invoices }
}

export async function serverAddInvoice(orgId: string, invoicePayload: any) {
  const { items, ...inv } = invoicePayload
  await prisma.invoice.create({
    data: {
      ...inv,
      orgId,
      items: {
        create: items
      }
    }
  })
}

export async function serverUpdateInvoice(id: string, updates: any) {
  await prisma.invoice.update({
    where: { id },
    data: updates
  })
}

export async function serverDeleteInvoice(id: string) {
  await prisma.invoice.delete({ where: { id } })
}

export async function serverAddAccount(orgId: string, accountPayload: any) {
  await prisma.account.create({
    data: {
      ...accountPayload,
      orgId
    }
  })
}

export async function serverUpdateAccount(id: string, updates: any) {
  await prisma.account.update({
    where: { id },
    data: updates
  })
}

export async function serverDeleteAccount(id: string) {
  await prisma.account.delete({ where: { id } })
}

export async function serverUpdateLedgerEntry(id: string, updates: any) {
  const { date, ...rest } = updates
  const data: any = { ...rest }
  if (date) data.date = new Date(date)
  
  const entry = await prisma.ledgerEntry.update({
    where: { id },
    data
  })
  
  // Re-calculate the account balance to ensure it stays accurate
  await syncAccountBalance(entry.accountId)
  return entry
}

export async function serverDeleteLedgerEntry(id: string) {
  const entry = await prisma.ledgerEntry.findUnique({ where: { id } })
  if (!entry) return
  
  const accountId = entry.accountId
  await prisma.ledgerEntry.delete({ where: { id } })
  
  await syncAccountBalance(accountId)
}

// Internal helper to keep balance in sync
async function syncAccountBalance(accountId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId }
  })
  
  const newBalance = entries.reduce((sum, e) => {
    return sum + (e.amount - e.discount + e.taxOrPaid - e.payment)
  }, 0)
  
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: newBalance }
  })
}

export async function serverAddLedgerEntry(accountId: string, entryPayload: any) {
  const { id, date, ...rest } = entryPayload
  const entry = await prisma.ledgerEntry.create({
    data: {
      ...rest,
      date: new Date(date),
      accountId
    }
  })
  
  await syncAccountBalance(accountId)
  return entry
}

export async function serverListOrganizations() {
  return await prisma.organization.findMany({
    select: { id: true, name: true }
  })
}

export async function serverDeleteOrganization(id: string) {
  await prisma.organization.delete({ where: { id } })
}

export async function serverAddOrganization(name: string, newId: string, masterPasswordHash?: string) {
  return await prisma.organization.create({
    data: {
      id: newId,
      name,
      masterPasswordHash
    }
  })
}

export async function serverGetMasterPasswordHash(orgId?: string) {
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { masterPasswordHash: true }
    })
    return org?.masterPasswordHash || null
  }
  const org = await prisma.organization.findFirst({
    select: { masterPasswordHash: true }
  })
  return org?.masterPasswordHash || null
}

export async function serverSetMasterPasswordHash(hash: string, orgId?: string) {
  if (orgId) {
    await prisma.organization.update({
      where: { id: orgId },
      data: { masterPasswordHash: hash }
    })
    return
  }
  const org = await prisma.organization.findFirst()
  if (org) {
    await prisma.organization.update({
      where: { id: org.id },
      data: { masterPasswordHash: hash }
    })
  }
}

export async function serverUpdateOrganization(id: string, updates: any) {
  await prisma.organization.update({
    where: { id },
    data: updates
  })
}
