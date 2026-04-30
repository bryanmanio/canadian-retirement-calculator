import type {
  ProjectionParams,
  RetirementProjection,
  RetirementReadiness,
  ScenarioProjections,
  WithdrawalBreakdown,
} from "@/types"
import {
  calculateIncomeTax,
  grossUpForTax,
  calculateOASAnnual,
  calculateOASClawback,
  calculateCPPAnnual,
} from "@/lib/tax"

const CURRENT_YEAR = new Date().getFullYear()

export function getTotalPortfolio(params: ProjectionParams): number {
  const { balances } = params
  return (
    balances.tfsa +
    balances.rrsp +
    balances.nonRegistered +
    balances.corporateInvestment +
    balances.otherSavings
  )
}

export function getTotalAnnualContribution(params: ProjectionParams): number {
  const { contributions } = params
  return (
    contributions.tfsa +
    contributions.rrsp +
    contributions.nonRegistered +
    contributions.corporate
  )
}

export function calculateRequiredPortfolio(params: ProjectionParams): number {
  const { target, benefits, assumptions, province } = params
  const yearsToRetirement = params.targetRetirementAge - params.currentAge

  // Government income at retirement (in today's real dollars; OAS/CPP indexed
  // to inflation in the projection so we just use the today-equivalent base)
  void yearsToRetirement
  const oasIncome =
    benefits.includeOAS && params.targetRetirementAge >= benefits.oasStartAge
      ? calculateOASAnnual(benefits.oasStartAge, 0, 0)
      : 0

  const cppIncome =
    benefits.includeCPP && params.targetRetirementAge >= benefits.cppStartAge
      ? calculateCPPAnnual(benefits.estimatedMonthlyCPP, benefits.cppStartAge)
      : 0

  const govIncome = oasIncome + cppIncome
  const incomeGap = Math.max(0, target.annualIncome - govIncome)

  // Gross up the income gap for taxes
  const grossWithdrawal = grossUpForTax(incomeGap, province, target.incomeType)

  return grossWithdrawal / assumptions.withdrawalRate
}

export function projectPortfolio(
  params: ProjectionParams,
  returnRate: number
): RetirementProjection[] {
  const {
    currentAge,
    targetRetirementAge,
    benefits,
    target,
    assumptions,
    province,
  } = params

  const projections: RetirementProjection[] = []
  const years = 40
  let portfolio = getTotalPortfolio(params)
  const annualContribution = getTotalAnnualContribution(params)
  const requiredPortfolio = calculateRequiredPortfolio(params)

  // Use REAL (inflation-adjusted) return rate so all values stay in today's
  // purchasing power. Otherwise nominal compounding over 40 years produces
  // numbers that look astronomical but represent the same real wealth.
  const realReturnRate = (1 + returnRate) / (1 + assumptions.inflationRate) - 1

  // OAS/CPP real growth: their indexing rate vs general inflation.
  // If oasIndexingRate < inflationRate, real value of benefits decays.
  const realBenefitGrowth = (1 + assumptions.oasIndexingRate) / (1 + assumptions.inflationRate) - 1

  for (let i = 0; i <= years; i++) {
    const age = currentAge + i
    const year = CURRENT_YEAR + i
    const yearsFromRetirement = age - targetRetirementAge
    const isRetired = age >= targetRetirementAge

    let annualWithdrawal = 0
    let oasIncome = 0
    let cppIncome = 0
    let taxOwed = 0
    let netIncome = 0

    if (isRetired) {
      // Government benefits in TODAY's dollars (real terms)
      if (benefits.includeOAS && age >= benefits.oasStartAge) {
        const yearsSinceOASStart = age - benefits.oasStartAge
        oasIncome = calculateOASAnnual(benefits.oasStartAge, 0, 0) *
          Math.pow(1 + realBenefitGrowth, Math.max(0, yearsSinceOASStart))
      }

      if (benefits.includeCPP && age >= benefits.cppStartAge) {
        const baseCPP = calculateCPPAnnual(benefits.estimatedMonthlyCPP, benefits.cppStartAge)
        const yearsSinceCPPStart = age - benefits.cppStartAge
        cppIncome = baseCPP * Math.pow(1 + realBenefitGrowth, Math.max(0, yearsSinceCPPStart))
      }

      // Target income held constant in real (today's) dollars
      const realTarget = target.annualIncome
      const govIncome = oasIncome + cppIncome
      const incomeGap = Math.max(0, realTarget - govIncome)

      // Gross up for tax (today's brackets — they're indexed to inflation)
      const grossNeeded = grossUpForTax(incomeGap, province, target.incomeType)
      void yearsFromRetirement
      annualWithdrawal = grossNeeded

      const taxCalc = calculateIncomeTax(grossNeeded + govIncome, province)
      taxOwed = taxCalc.totalTax
      netIncome = realTarget

      // Drawdown phase (mid-year convention) using REAL return
      portfolio = Math.max(0, (portfolio - annualWithdrawal / 2) * (1 + realReturnRate) - annualWithdrawal / 2)
    } else if (i > 0) {
      // Accumulation phase using REAL return
      portfolio = (portfolio + annualContribution / 2) * (1 + realReturnRate) + annualContribution / 2
    }

    projections.push({
      year,
      age,
      portfolioValue: portfolio,
      annualContribution: isRetired ? 0 : annualContribution,
      annualWithdrawal,
      oasIncome,
      cppIncome,
      taxOwed,
      netIncome,
      requiredPortfolio,
    })
  }

  return projections
}

export function computeAllScenarios(params: ProjectionParams): ScenarioProjections {
  return {
    best: projectPortfolio(params, params.assumptions.scenarioReturns.best),
    current: projectPortfolio(params, params.assumptions.scenarioReturns.current),
    worst: projectPortfolio(params, params.assumptions.scenarioReturns.worst),
  }
}

export function calculateRetirementReadiness(
  projections: RetirementProjection[],
  params: ProjectionParams
): RetirementReadiness {
  const yearsToRetirement = params.targetRetirementAge - params.currentAge
  const retirementProjection = projections.find(p => p.age === params.targetRetirementAge)
  const requiredPortfolio = calculateRequiredPortfolio(params)
  const portfolioToday = getTotalPortfolio(params)
  const projectedAtRetirement = retirementProjection?.portfolioValue ?? 0

  const surplusOrDeficit = projectedAtRetirement - requiredPortfolio
  const fundingRatio = requiredPortfolio > 0 ? projectedAtRetirement / requiredPortfolio : 0

  // Calculate additional monthly savings needed to close gap
  let additionalMonthlySavingsNeeded = 0
  if (projectedAtRetirement < requiredPortfolio && yearsToRetirement > 0) {
    const gap = requiredPortfolio - projectedAtRetirement
    const r = params.assumptions.scenarioReturns.current / 12
    const n = yearsToRetirement * 12
    if (r > 0) {
      additionalMonthlySavingsNeeded = (gap * r) / (Math.pow(1 + r, n) - 1)
    } else {
      additionalMonthlySavingsNeeded = gap / n
    }
  }

  // Projected monthly income from portfolio at 4% rule
  const sustainableAnnual = projectedAtRetirement * params.assumptions.withdrawalRate
  const { oasIncome = 0, cppIncome = 0 } = retirementProjection ?? {}
  const projectedMonthlyIncome = (sustainableAnnual + oasIncome + cppIncome) / 12

  // OAS coverage
  const oasCoveragePercent = params.target.annualIncome > 0 ? oasIncome / params.target.annualIncome : 0

  // Effective tax rate at retirement income
  const grossAtRetirement = grossUpForTax(params.target.annualIncome, params.province, params.target.incomeType)
  const taxResult = calculateIncomeTax(grossAtRetirement, params.province)
  const effectiveTaxRate = taxResult.effectiveRate

  return {
    yearsToRetirement: Math.max(0, yearsToRetirement),
    portfolioToday,
    projectedAtRetirement,
    requiredPortfolio,
    surplusOrDeficit,
    fundingRatio,
    additionalMonthlySavingsNeeded,
    projectedMonthlyIncome,
    oasCoveragePercent,
    effectiveTaxRate,
  }
}

export function computeWithdrawalBreakdown(
  projections: RetirementProjection[],
  params: ProjectionParams
): WithdrawalBreakdown[] {
  const retirementIdx = projections.findIndex(p => p.age === params.targetRetirementAge)
  if (retirementIdx === -1) return []

  const results: WithdrawalBreakdown[] = []

  // Pre-65 snapshot
  const pre65 = projections.find(p => p.age === params.targetRetirementAge)
  if (pre65 && params.targetRetirementAge < 65) {
    const grossNeeded = pre65.annualWithdrawal
    const inflatedTarget = params.target.annualIncome
    const tfsaRatio = params.balances.tfsa / Math.max(1, getTotalPortfolio(params))

    results.push({
      label: `Pre-65 (Age ${params.targetRetirementAge})`,
      age: params.targetRetirementAge,
      tfsaWithdrawal: grossNeeded * tfsaRatio,
      rrspWithdrawal: grossNeeded * (1 - tfsaRatio) * 0.6,
      nonRegWithdrawal: grossNeeded * (1 - tfsaRatio) * 0.4,
      oasIncome: 0,
      cppIncome: pre65.cppIncome,
      taxOwed: pre65.taxOwed,
      oasClawback: 0,
      totalGross: grossNeeded,
      totalNet: inflatedTarget,
    })
  }

  // Post-65 snapshot
  const post65 = projections.find(p => p.age === 65)
  if (post65) {
    const grossNeeded = post65.annualWithdrawal
    const clawback = calculateOASClawback(grossNeeded + post65.oasIncome, post65.oasIncome)

    results.push({
      label: "Post-65 (Age 65)",
      age: 65,
      tfsaWithdrawal: grossNeeded * 0.3,
      rrspWithdrawal: grossNeeded * 0.4,
      nonRegWithdrawal: grossNeeded * 0.3,
      oasIncome: post65.oasIncome,
      cppIncome: post65.cppIncome,
      taxOwed: post65.taxOwed,
      oasClawback: clawback,
      totalGross: grossNeeded + post65.oasIncome + post65.cppIncome,
      totalNet: params.target.annualIncome,
    })
  }

  return results
}

export function buildProjectionCSV(
  projections: RetirementProjection[],
  label: string
): string {
  const header = "Year,Age,Portfolio Value,Annual Contribution,Annual Withdrawal,OAS Income,CPP Income,Tax Owed,Net Income,Required Portfolio"
  const rows = projections.map(p =>
    [
      p.year,
      p.age,
      p.portfolioValue.toFixed(0),
      p.annualContribution.toFixed(0),
      p.annualWithdrawal.toFixed(0),
      p.oasIncome.toFixed(0),
      p.cppIncome.toFixed(0),
      p.taxOwed.toFixed(0),
      p.netIncome.toFixed(0),
      p.requiredPortfolio.toFixed(0),
    ].join(",")
  )
  return `${label}\n${header}\n${rows.join("\n")}`
}
