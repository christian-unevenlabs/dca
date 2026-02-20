/**
 * Applies the Prisma schema and seed data to a Turso database.
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx tsx scripts/turso-setup.ts
 */
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('Missing TURSO_DATABASE_URL')
  process.exit(1)
}

const db = createClient({ url, authToken })

const DDL = [
  `CREATE TABLE IF NOT EXISTS "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'ethereum',
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "walletAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "TokenAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "chainName" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PayrollRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "PayEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "amountUSDC" REAL NOT NULL,
    "toToken" TEXT NOT NULL,
    "toChain" TEXT NOT NULL,
    "toChainId" INTEGER NOT NULL,
    "toAddress" TEXT NOT NULL,
    "relayQuoteId" TEXT,
    "relayTxHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "relayFeeBps" REAL,
    "relayFeeUSD" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
]

function randomTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function cuid(): string {
  return 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

async function main() {
  console.log('📐 Applying schema...')
  for (const stmt of DDL) {
    await db.execute(stmt)
  }
  console.log('✅ Schema applied')

  // Clear existing data
  for (const table of ['PayEvent', 'PayrollRun', 'TokenAllocation', 'Employee', 'Company']) {
    await db.execute(`DELETE FROM "${table}"`)
  }

  console.log('🌱 Seeding...')

  // Acme Corp
  const acmeId = cuid()
  await db.execute({
    sql: `INSERT INTO "Company" (id, name, walletAddress, chain, balance) VALUES (?, ?, ?, ?, ?)`,
    args: [acmeId, 'Acme Corp', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'ethereum', 50000],
  })

  const acmeEmployees = [
    { id: cuid(), name: 'Alice Chen', email: 'alice@acme.corp', wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b' },
    { id: cuid(), name: 'Bob Martinez', email: 'bob@acme.corp', wallet: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c' },
    { id: cuid(), name: 'Carol Kim', email: 'carol@acme.corp', wallet: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d' },
    { id: cuid(), name: 'David Park', email: 'david@acme.corp', wallet: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e' },
    { id: cuid(), name: 'Emma Wilson', email: 'emma@acme.corp', wallet: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f' },
    { id: cuid(), name: 'Frank Liu', email: 'frank@acme.corp', wallet: null },
  ]

  for (const emp of acmeEmployees) {
    await db.execute({
      sql: `INSERT INTO "Employee" (id, name, email, companyId, walletAddress) VALUES (?, ?, ?, ?, ?)`,
      args: [emp.id, emp.name, emp.email, acmeId, emp.wallet],
    })
  }

  // Allocations
  const allocations = [
    { empId: acmeEmployees[0].id, symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chainId: 792703809, chain: 'Solana', pct: 100 },
    { empId: acmeEmployees[1].id, symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', chainId: 1, chain: 'Ethereum', pct: 50 },
    { empId: acmeEmployees[1].id, symbol: 'USDC', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', chainId: 8453, chain: 'Base', pct: 50 },
    { empId: acmeEmployees[2].id, symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', chainId: 1, chain: 'Ethereum', pct: 100 },
    { empId: acmeEmployees[3].id, symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', chainId: 1, chain: 'Ethereum', pct: 33 },
    { empId: acmeEmployees[3].id, symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', chainId: 792703809, chain: 'Solana', pct: 33 },
    { empId: acmeEmployees[3].id, symbol: 'ARB', address: '0x912ce59144191c1204e64559fe8253a0e49e6548', chainId: 42161, chain: 'Arbitrum', pct: 34 },
    { empId: acmeEmployees[4].id, symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', chainId: 792703809, chain: 'Solana', pct: 75 },
    { empId: acmeEmployees[4].id, symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chainId: 792703809, chain: 'Solana', pct: 25 },
  ]

  for (const a of allocations) {
    await db.execute({
      sql: `INSERT INTO "TokenAllocation" (id, employeeId, tokenSymbol, tokenAddress, chainId, chainName, percentage, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [cuid(), a.empId, a.symbol, a.address, a.chainId, a.chain, a.pct, new Date().toISOString()],
    })
  }

  // Payroll runs + pay events
  const runs = [
    { amount: 10000, status: 'complete', daysBack: 60 },
    { amount: 12000, status: 'complete', daysBack: 30 },
    { amount: 11500, status: 'complete', daysBack: 7 },
    { amount: 12500, status: 'processing', daysBack: 0 },
  ]

  for (const run of runs) {
    const runId = cuid()
    const executedAt = run.status === 'complete' ? daysAgo(run.daysBack) : null
    await db.execute({
      sql: `INSERT INTO "PayrollRun" (id, companyId, totalAmount, currency, status, executedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [runId, acmeId, run.amount, 'USDC', run.status, executedAt, daysAgo(run.daysBack)],
    })

    if (run.status === 'complete') {
      const perEmp = run.amount / 6
      for (const emp of acmeEmployees) {
        await db.execute({
          sql: `INSERT INTO "PayEvent" (id, employeeId, payrollRunId, amountUSDC, toToken, toChain, toChainId, toAddress, relayTxHash, status, relayFeeBps, relayFeeUSD, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [cuid(), emp.id, runId, Math.round(perEmp * 100) / 100, 'USDC', 'Solana', 792703809, emp.wallet ?? '0x0000000000000000000000000000000000000000', randomTxHash(), 'complete', 15, Math.round(perEmp * 0.0015 * 100) / 100, daysAgo(run.daysBack)],
        })
      }
    }
  }

  // Builder DAO
  const daoId = cuid()
  await db.execute({
    sql: `INSERT INTO "Company" (id, name, walletAddress, chain, balance) VALUES (?, ?, ?, ?, ?)`,
    args: [daoId, 'Builder DAO', '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'base', 28000],
  })

  const daoEmployees = [
    { id: cuid(), name: 'Grace Thompson', email: 'grace@builderdao.xyz', wallet: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a' },
    { id: cuid(), name: 'Henry Zhang', email: 'henry@builderdao.xyz', wallet: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b' },
    { id: cuid(), name: 'Isla Rodriguez', email: 'isla@builderdao.xyz', wallet: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c' },
    { id: cuid(), name: "James O'Brien", email: 'james@builderdao.xyz', wallet: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d' },
  ]

  for (const emp of daoEmployees) {
    await db.execute({
      sql: `INSERT INTO "Employee" (id, name, email, companyId, walletAddress) VALUES (?, ?, ?, ?, ?)`,
      args: [emp.id, emp.name, emp.email, daoId, emp.wallet],
    })
  }

  for (const amount of [8000, 9500]) {
    const runId = cuid()
    const daysBack = amount === 8000 ? 45 : 15
    await db.execute({
      sql: `INSERT INTO "PayrollRun" (id, companyId, totalAmount, currency, status, executedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [runId, daoId, amount, 'USDC', 'complete', daysAgo(daysBack), daysAgo(daysBack)],
    })
    const perEmp = amount / 4
    for (const emp of daoEmployees) {
      await db.execute({
        sql: `INSERT INTO "PayEvent" (id, employeeId, payrollRunId, amountUSDC, toToken, toChain, toChainId, toAddress, relayTxHash, status, relayFeeBps, relayFeeUSD, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [cuid(), emp.id, runId, perEmp, 'ETH', 'Base', 8453, emp.wallet, randomTxHash(), 'complete', 15, Math.round(perEmp * 0.0015 * 100) / 100, daysAgo(daysBack)],
      })
    }
  }

  console.log('✅ Seed complete — Acme Corp + Builder DAO loaded into Turso')
  await db.close()
}

main().catch(err => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
