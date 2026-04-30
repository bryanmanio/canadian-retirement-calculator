"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type {
  ProvinceCode,
  AccountCategory,
  PortfolioBalances,
  Contributions,
  GovernmentBenefits,
  RetirementTarget,
  Assumptions,
  MonteCarloResult,
  LunchMoneyAccount,
} from "@/types"
import { DEFAULT_ASSUMPTIONS } from "@/lib/constants"
import { runSimulations } from "@/lib/monteCarlo"
import {
  validateLunchMoneyKey,
  fetchLunchMoneyAccounts,
  saveLunchMoneyKey,
  clearLunchMoneyKey,
  getLunchMoneyKey,
  suggestCategory,
} from "@/lib/lunchmoney"
import {
  getTotalPortfolio,
  getTotalAnnualContribution,
  calculateRequiredPortfolio,
} from "@/lib/retirement"

const DEFAULT_BALANCES: PortfolioBalances = {
  tfsa: 25_000,
  rrsp: 75_000,
  nonRegistered: 0,
  corporateInvestment: 0,
  otherSavings: 0,
}

const DEFAULT_CONTRIBUTIONS: Contributions = {
  tfsa: 7_000,
  rrsp: 15_000,
  nonRegistered: 0,
  corporate: 0,
}

const DEFAULT_BENEFITS: GovernmentBenefits = {
  includeOAS: true,
  oasStartAge: 65,
  includeCPP: true,
  cppStartAge: 65,
  estimatedMonthlyCPP: 800,
}

const DEFAULT_TARGET: RetirementTarget = {
  annualIncome: 80_000,
  incomeType: "salary",
  withdrawalStructure: "personal-first",
}

interface CalculatorState {
  currentAge: number
  targetRetirementAge: number
  province: ProvinceCode
  filingStatus: "single" | "married"

  balances: PortfolioBalances
  contributions: Contributions
  target: RetirementTarget
  benefits: GovernmentBenefits
  assumptions: Assumptions

  monteCarloEnabled: boolean
  monteCarloRunning: boolean
  monteCarloResults: MonteCarloResult | null

  lmConnected: boolean
  lmLastSynced: string | null
  lmAccounts: LunchMoneyAccount[]
  lmAccountCategories: Record<string, AccountCategory>
  lmSyncError: string | null
  lmSyncing: boolean

  // Actions
  setAge(age: number): void
  setRetirementAge(age: number): void
  setProvince(province: ProvinceCode): void
  setFilingStatus(status: "single" | "married"): void
  setBalances(updates: Partial<PortfolioBalances>): void
  setContributions(updates: Partial<Contributions>): void
  setTarget(updates: Partial<RetirementTarget>): void
  setBenefits(updates: Partial<GovernmentBenefits>): void
  setAssumptions(updates: Partial<Assumptions>): void
  setScenarioReturn(key: "best" | "current" | "worst", rate: number): void
  toggleMonteCarlo(): void
  runMonteCarlo(): void
  connectLunchMoney(key: string): Promise<void>
  disconnectLunchMoney(): void
  syncLunchMoney(): Promise<void>
  setAccountCategory(id: string, category: AccountCategory): void
  applyLunchMoneyToBalances(): void
  loadFromURL(params: URLSearchParams): void
  serializeToURL(): string
  resetDefaults(): void
  initFromLocalStorage(): void
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    immer((set, get) => ({
      currentAge: 35,
      targetRetirementAge: 60,
      province: "ON" as ProvinceCode,
      filingStatus: "single" as const,

      balances: DEFAULT_BALANCES,
      contributions: DEFAULT_CONTRIBUTIONS,
      target: DEFAULT_TARGET,
      benefits: DEFAULT_BENEFITS,
      assumptions: DEFAULT_ASSUMPTIONS,

      monteCarloEnabled: false,
      monteCarloRunning: false,
      monteCarloResults: null,

      lmConnected: false,
      lmLastSynced: null,
      lmAccounts: [],
      lmAccountCategories: {},
      lmSyncError: null,
      lmSyncing: false,

      setAge: (age) => set(s => { s.currentAge = age }),
      setRetirementAge: (age) => set(s => { s.targetRetirementAge = age }),
      setProvince: (province) => set(s => { s.province = province }),
      setFilingStatus: (status) => set(s => { s.filingStatus = status }),

      setBalances: (updates) => set(s => { Object.assign(s.balances, updates) }),
      setContributions: (updates) => set(s => { Object.assign(s.contributions, updates) }),
      setTarget: (updates) => set(s => { Object.assign(s.target, updates) }),
      setBenefits: (updates) => set(s => { Object.assign(s.benefits, updates) }),
      setAssumptions: (updates) => set(s => { Object.assign(s.assumptions, updates) }),

      setScenarioReturn: (key, rate) =>
        set(s => { s.assumptions.scenarioReturns[key] = rate }),

      toggleMonteCarlo: () =>
        set(s => { s.monteCarloEnabled = !s.monteCarloEnabled }),

      runMonteCarlo: () => {
        const state = get()
        set(s => { s.monteCarloRunning = true })

        const params = {
          currentAge: state.currentAge,
          targetRetirementAge: state.targetRetirementAge,
          province: state.province,
          balances: state.balances,
          contributions: state.contributions,
          target: state.target,
          benefits: state.benefits,
          assumptions: state.assumptions,
        }

        const totalPortfolio = getTotalPortfolio(params)
        const annualContribution = getTotalAnnualContribution(params)
        const requiredPortfolio = calculateRequiredPortfolio(params)
        const annualGrossWithdrawal = requiredPortfolio * state.assumptions.withdrawalRate

        setTimeout(() => {
          try {
            const result = runSimulations({
              currentPortfolio: totalPortfolio,
              annualContribution,
              annualGrossWithdrawal,
              mean: state.assumptions.scenarioReturns.current,
              stdDev: state.assumptions.stdDev,
              yearsToRetirement: Math.max(0, state.targetRetirementAge - state.currentAge),
              yearsInRetirement: Math.max(0, 90 - state.targetRetirementAge),
              inflationRate: state.assumptions.inflationRate,
              simulations: state.assumptions.monteCarloSimulations,
            })
            set(s => {
              s.monteCarloResults = result
              s.monteCarloRunning = false
            })
          } catch {
            set(s => { s.monteCarloRunning = false })
          }
        }, 10)
      },

      connectLunchMoney: async (key: string) => {
        set(s => { s.lmSyncError = null; s.lmSyncing = true })
        try {
          const valid = await validateLunchMoneyKey(key)
          if (!valid) throw new Error("Invalid API key — please check and try again.")
          saveLunchMoneyKey(key)
          const accounts = await fetchLunchMoneyAccounts(key)
          const categories: Record<string, AccountCategory> = {}
          for (const acc of accounts) {
            const suggested = suggestCategory(acc)
            if (suggested) categories[String(acc.id)] = suggested as AccountCategory
          }
          set(s => {
            s.lmConnected = true
            s.lmAccounts = accounts
            s.lmAccountCategories = categories
            s.lmLastSynced = new Date().toISOString()
            s.lmSyncing = false
          })
        } catch (err) {
          set(s => {
            s.lmSyncError = err instanceof Error ? err.message : "Connection failed"
            s.lmSyncing = false
          })
        }
      },

      disconnectLunchMoney: () => {
        clearLunchMoneyKey()
        set(s => {
          s.lmConnected = false
          s.lmAccounts = []
          s.lmAccountCategories = {}
          s.lmLastSynced = null
          s.lmSyncError = null
        })
      },

      syncLunchMoney: async () => {
        const key = getLunchMoneyKey()
        if (!key) return
        set(s => { s.lmSyncing = true; s.lmSyncError = null })
        try {
          const accounts = await fetchLunchMoneyAccounts(key)
          set(s => {
            s.lmAccounts = accounts
            s.lmLastSynced = new Date().toISOString()
            s.lmSyncing = false
          })
        } catch (err) {
          set(s => {
            s.lmSyncError = err instanceof Error ? err.message : "Sync failed"
            s.lmSyncing = false
          })
        }
      },

      setAccountCategory: (id: string, category: AccountCategory) =>
        set(s => { s.lmAccountCategories[id] = category }),

      applyLunchMoneyToBalances: () => {
        const { lmAccounts, lmAccountCategories } = get()
        const newBalances: PortfolioBalances = { tfsa: 0, rrsp: 0, nonRegistered: 0, corporateInvestment: 0, otherSavings: 0 }

        for (const acc of lmAccounts) {
          const cat = lmAccountCategories[String(acc.id)]
          if (!cat || cat === "ignore" || cat === "cash") continue
          const balance = Math.abs(parseFloat(acc.balance) || 0)

          if (cat === "tfsa") newBalances.tfsa += balance
          else if (cat === "rrsp" || cat === "lira") newBalances.rrsp += balance
          else if (cat === "nonRegistered" || cat === "fhsa" || cat === "rdsp") newBalances.nonRegistered += balance
          else if (cat === "corporateInvestment" || cat === "corporateSavings") newBalances.corporateInvestment += balance
          else newBalances.otherSavings += balance
        }

        set(s => { Object.assign(s.balances, newBalances) })
      },

      loadFromURL: (params: URLSearchParams) => {
        set(s => {
          const ca = params.get("ca"); if (ca) s.currentAge = parseInt(ca)
          const ra = params.get("ra"); if (ra) s.targetRetirementAge = parseInt(ra)
          const pv = params.get("pv"); if (pv) s.province = pv as ProvinceCode
          const tb = params.get("tb"); if (tb) s.balances.tfsa = parseInt(tb)
          const rb = params.get("rb"); if (rb) s.balances.rrsp = parseInt(rb)
          const nb = params.get("nb"); if (nb) s.balances.nonRegistered = parseInt(nb)
          const cb = params.get("cb"); if (cb) s.balances.corporateInvestment = parseInt(cb)
          const ob = params.get("ob"); if (ob) s.balances.otherSavings = parseInt(ob)
          const tc = params.get("tc"); if (tc) s.contributions.tfsa = parseInt(tc)
          const rc = params.get("rc"); if (rc) s.contributions.rrsp = parseInt(rc)
          const ti = params.get("ti"); if (ti) s.target.annualIncome = parseInt(ti)
          const wr = params.get("wr"); if (wr) s.assumptions.withdrawalRate = parseFloat(wr)
          const ir = params.get("ir"); if (ir) s.assumptions.inflationRate = parseFloat(ir)
          const br = params.get("br"); if (br) s.assumptions.scenarioReturns.best = parseFloat(br)
          const cr = params.get("cr"); if (cr) s.assumptions.scenarioReturns.current = parseFloat(cr)
          const wsr = params.get("wsr"); if (wsr) s.assumptions.scenarioReturns.worst = parseFloat(wsr)
          const cpp = params.get("cpp"); if (cpp) s.benefits.estimatedMonthlyCPP = parseInt(cpp)
          const oas = params.get("oas"); if (oas) s.benefits.oasStartAge = parseInt(oas) as GovernmentBenefits["oasStartAge"]
        })
      },

      serializeToURL: () => {
        const s = get()
        const p = new URLSearchParams({
          ca: String(s.currentAge),
          ra: String(s.targetRetirementAge),
          pv: s.province,
          tb: String(s.balances.tfsa),
          rb: String(s.balances.rrsp),
          nb: String(s.balances.nonRegistered),
          cb: String(s.balances.corporateInvestment),
          ob: String(s.balances.otherSavings),
          tc: String(s.contributions.tfsa),
          rc: String(s.contributions.rrsp),
          ti: String(s.target.annualIncome),
          wr: String(s.assumptions.withdrawalRate),
          ir: String(s.assumptions.inflationRate),
          br: String(s.assumptions.scenarioReturns.best),
          cr: String(s.assumptions.scenarioReturns.current),
          wsr: String(s.assumptions.scenarioReturns.worst),
          cpp: String(s.benefits.estimatedMonthlyCPP),
          oas: String(s.benefits.oasStartAge),
        })
        return p.toString()
      },

      resetDefaults: () =>
        set(s => {
          s.currentAge = 35
          s.targetRetirementAge = 60
          s.province = "ON"
          s.filingStatus = "single"
          Object.assign(s.balances, DEFAULT_BALANCES)
          Object.assign(s.contributions, DEFAULT_CONTRIBUTIONS)
          Object.assign(s.target, DEFAULT_TARGET)
          Object.assign(s.benefits, DEFAULT_BENEFITS)
          Object.assign(s.assumptions, DEFAULT_ASSUMPTIONS)
        }),

      initFromLocalStorage: () => {
        const key = getLunchMoneyKey()
        if (key) {
          const { lmConnected } = get()
          if (!lmConnected) {
            get().syncLunchMoney().catch(() => {})
          }
        }
      },
    })),
    {
      name: "retirement-calc-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { monteCarloResults, monteCarloRunning, lmSyncError, lmSyncing, ...rest } = state
        return rest
      },
    }
  )
)
