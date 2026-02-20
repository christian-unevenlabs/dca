import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

function randomTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  if (process.env.TURSO_DATABASE_URL) {
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN ?? '',
    })
    prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
  } else {
    prisma = new PrismaClient()
  }

  console.log('🌱 Seeding database...')

  // Clean up existing data
  await prisma.payEvent.deleteMany()
  await prisma.payrollRun.deleteMany()
  await prisma.tokenAllocation.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.company.deleteMany()

  // ─── Company 1: Acme Corp ───────────────────────────────────────────────────
  const acme = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      chain: 'ethereum',
      balance: 50000,
    },
  })

  const acmeEmployees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'Alice Chen',
        email: 'alice@acme.corp',
        companyId: acme.id,
        walletAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        allocations: {
          create: [
            {
              tokenSymbol: 'USDC',
              tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              chainId: 792703809,
              chainName: 'Solana',
              percentage: 100,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Bob Martinez',
        email: 'bob@acme.corp',
        companyId: acme.id,
        walletAddress: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
        allocations: {
          create: [
            {
              tokenSymbol: 'ETH',
              tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              chainId: 1,
              chainName: 'Ethereum',
              percentage: 50,
            },
            {
              tokenSymbol: 'USDC',
              tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
              chainId: 8453,
              chainName: 'Base',
              percentage: 50,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Carol Kim',
        email: 'carol@acme.corp',
        companyId: acme.id,
        walletAddress: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
        allocations: {
          create: [
            {
              tokenSymbol: 'WBTC',
              tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
              chainId: 1,
              chainName: 'Ethereum',
              percentage: 100,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'David Park',
        email: 'david@acme.corp',
        companyId: acme.id,
        walletAddress: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
        allocations: {
          create: [
            {
              tokenSymbol: 'ETH',
              tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              chainId: 1,
              chainName: 'Ethereum',
              percentage: 33,
            },
            {
              tokenSymbol: 'SOL',
              tokenAddress: 'So11111111111111111111111111111111111111112',
              chainId: 792703809,
              chainName: 'Solana',
              percentage: 33,
            },
            {
              tokenSymbol: 'ARB',
              tokenAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548',
              chainId: 42161,
              chainName: 'Arbitrum',
              percentage: 34,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Emma Wilson',
        email: 'emma@acme.corp',
        companyId: acme.id,
        walletAddress: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
        allocations: {
          create: [
            {
              tokenSymbol: 'SOL',
              tokenAddress: 'So11111111111111111111111111111111111111112',
              chainId: 792703809,
              chainName: 'Solana',
              percentage: 75,
            },
            {
              tokenSymbol: 'USDC',
              tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              chainId: 792703809,
              chainName: 'Solana',
              percentage: 25,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Frank Liu',
        email: 'frank@acme.corp',
        companyId: acme.id,
        walletAddress: null, // No preference set
        allocations: { create: [] },
      },
    }),
  ])

  // Acme payroll runs
  const acmeRun1 = await prisma.payrollRun.create({
    data: {
      companyId: acme.id,
      totalAmount: 10000,
      currency: 'USDC',
      status: 'complete',
      executedAt: daysAgo(60),
      createdAt: daysAgo(60),
    },
  })

  // Pay events for run 1
  const run1PerEmployee = 10000 / 6
  for (const emp of acmeEmployees.slice(0, 5)) {
    await prisma.payEvent.create({
      data: {
        employeeId: emp.id,
        payrollRunId: acmeRun1.id,
        amountUSDC: Math.round(run1PerEmployee * 100) / 100,
        toToken: 'USDC',
        toChain: 'Solana',
        toChainId: 792703809,
        toAddress: emp.walletAddress ?? '0x0000000000000000000000000000000000000000',
        relayTxHash: randomTxHash(),
        status: 'complete',
        relayFeeBps: 15,
        relayFeeUSD: Math.round(run1PerEmployee * 0.0015 * 100) / 100,
        createdAt: daysAgo(60),
      },
    })
  }

  const acmeRun2 = await prisma.payrollRun.create({
    data: {
      companyId: acme.id,
      totalAmount: 12000,
      currency: 'USDC',
      status: 'complete',
      executedAt: daysAgo(30),
      createdAt: daysAgo(30),
    },
  })

  const run2PerEmployee = 12000 / 6
  for (const emp of acmeEmployees) {
    await prisma.payEvent.create({
      data: {
        employeeId: emp.id,
        payrollRunId: acmeRun2.id,
        amountUSDC: Math.round(run2PerEmployee * 100) / 100,
        toToken: emp.id === acmeEmployees[2].id ? 'WBTC' : 'USDC',
        toChain: emp.id === acmeEmployees[2].id ? 'Ethereum' : 'Solana',
        toChainId: emp.id === acmeEmployees[2].id ? 1 : 792703809,
        toAddress: emp.walletAddress ?? '0x0000000000000000000000000000000000000000',
        relayTxHash: randomTxHash(),
        status: 'complete',
        relayFeeBps: 15,
        relayFeeUSD: Math.round(run2PerEmployee * 0.0015 * 100) / 100,
        createdAt: daysAgo(30),
      },
    })
  }

  const acmeRun3 = await prisma.payrollRun.create({
    data: {
      companyId: acme.id,
      totalAmount: 11500,
      currency: 'USDC',
      status: 'complete',
      executedAt: daysAgo(7),
      createdAt: daysAgo(7),
    },
  })

  const run3PerEmployee = 11500 / 6
  for (const emp of acmeEmployees) {
    await prisma.payEvent.create({
      data: {
        employeeId: emp.id,
        payrollRunId: acmeRun3.id,
        amountUSDC: Math.round(run3PerEmployee * 100) / 100,
        toToken: 'ETH',
        toChain: 'Ethereum',
        toChainId: 1,
        toAddress: emp.walletAddress ?? '0x0000000000000000000000000000000000000000',
        relayTxHash: randomTxHash(),
        status: 'complete',
        relayFeeBps: 15,
        relayFeeUSD: Math.round(run3PerEmployee * 0.0015 * 100) / 100,
        createdAt: daysAgo(7),
      },
    })
  }

  // In-progress run
  await prisma.payrollRun.create({
    data: {
      companyId: acme.id,
      totalAmount: 12500,
      currency: 'USDC',
      status: 'processing',
      createdAt: new Date(),
    },
  })

  // ─── Company 2: Builder DAO ──────────────────────────────────────────────────
  const builderDao = await prisma.company.create({
    data: {
      name: 'Builder DAO',
      walletAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      chain: 'base',
      balance: 28000,
    },
  })

  const daoEmployees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'Grace Thompson',
        email: 'grace@builderdao.xyz',
        companyId: builderDao.id,
        walletAddress: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        allocations: {
          create: [
            {
              tokenSymbol: 'ETH',
              tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              chainId: 8453,
              chainName: 'Base',
              percentage: 60,
            },
            {
              tokenSymbol: 'USDC',
              tokenAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
              chainId: 8453,
              chainName: 'Base',
              percentage: 40,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Henry Zhang',
        email: 'henry@builderdao.xyz',
        companyId: builderDao.id,
        walletAddress: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
        allocations: {
          create: [
            {
              tokenSymbol: 'OP',
              tokenAddress: '0x4200000000000000000000000000000000000042',
              chainId: 10,
              chainName: 'Optimism',
              percentage: 50,
            },
            {
              tokenSymbol: 'ARB',
              tokenAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548',
              chainId: 42161,
              chainName: 'Arbitrum',
              percentage: 50,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Isla Rodriguez',
        email: 'isla@builderdao.xyz',
        companyId: builderDao.id,
        walletAddress: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c',
        allocations: {
          create: [
            {
              tokenSymbol: 'SOL',
              tokenAddress: 'So11111111111111111111111111111111111111112',
              chainId: 792703809,
              chainName: 'Solana',
              percentage: 40,
            },
            {
              tokenSymbol: 'AVAX',
              tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              chainId: 43114,
              chainName: 'Avalanche',
              percentage: 30,
            },
            {
              tokenSymbol: 'ETH',
              tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              chainId: 8453,
              chainName: 'Base',
              percentage: 30,
            },
          ],
        },
      },
    }),
    prisma.employee.create({
      data: {
        name: 'James O\'Brien',
        email: 'james@builderdao.xyz',
        companyId: builderDao.id,
        walletAddress: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
        allocations: {
          create: [
            {
              tokenSymbol: 'WBTC',
              tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
              chainId: 1,
              chainName: 'Ethereum',
              percentage: 70,
            },
            {
              tokenSymbol: 'ETH',
              tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              chainId: 1,
              chainName: 'Ethereum',
              percentage: 30,
            },
          ],
        },
      },
    }),
  ])

  // Builder DAO payroll runs
  const daoRun1 = await prisma.payrollRun.create({
    data: {
      companyId: builderDao.id,
      totalAmount: 8000,
      currency: 'USDC',
      status: 'complete',
      executedAt: daysAgo(45),
      createdAt: daysAgo(45),
    },
  })

  const daoRun1PerEmployee = 8000 / 4
  for (const emp of daoEmployees) {
    await prisma.payEvent.create({
      data: {
        employeeId: emp.id,
        payrollRunId: daoRun1.id,
        amountUSDC: daoRun1PerEmployee,
        toToken: 'ETH',
        toChain: 'Base',
        toChainId: 8453,
        toAddress: emp.walletAddress ?? '',
        relayTxHash: randomTxHash(),
        status: 'complete',
        relayFeeBps: 15,
        relayFeeUSD: Math.round(daoRun1PerEmployee * 0.0015 * 100) / 100,
        createdAt: daysAgo(45),
      },
    })
  }

  const daoRun2 = await prisma.payrollRun.create({
    data: {
      companyId: builderDao.id,
      totalAmount: 9500,
      currency: 'USDC',
      status: 'complete',
      executedAt: daysAgo(15),
      createdAt: daysAgo(15),
    },
  })

  const daoRun2PerEmployee = 9500 / 4
  for (const emp of daoEmployees) {
    await prisma.payEvent.create({
      data: {
        employeeId: emp.id,
        payrollRunId: daoRun2.id,
        amountUSDC: daoRun2PerEmployee,
        toToken: 'USDC',
        toChain: 'Base',
        toChainId: 8453,
        toAddress: emp.walletAddress ?? '',
        relayTxHash: randomTxHash(),
        status: 'complete',
        relayFeeBps: 12,
        relayFeeUSD: Math.round(daoRun2PerEmployee * 0.0012 * 100) / 100,
        createdAt: daysAgo(15),
      },
    })
  }

  console.log('✅ Seed complete!')
  console.log(`   Acme Corp: ${acmeEmployees.length} employees, 4 payroll runs`)
  console.log(`   Builder DAO: ${daoEmployees.length} employees, 2 payroll runs`)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
