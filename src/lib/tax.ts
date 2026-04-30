import type { ProvinceCode, TaxResult } from "@/types"
import {
  FEDERAL_BRACKETS_2025,
  FEDERAL_BPA_2025,
  FEDERAL_ELIGIBLE_GROSS_UP,
  FEDERAL_ELIGIBLE_DTC_RATE,
  PROVINCE_TAX_CONFIG,
  OAS_2025,
  OAS_ANNUAL_BY_START_AGE,
  CPP_2025,
  type TaxBracket,
} from "@/lib/constants"

function applyBrackets(income: number, brackets: TaxBracket[]): number {
  let tax = 0
  for (const bracket of brackets) {
    if (income <= bracket.min) break
    const taxable = Math.min(income, bracket.max) - bracket.min
    tax += taxable * bracket.rate
  }
  return tax
}

function getProvincialSurtax(
  baseTax: number,
  config: (typeof PROVINCE_TAX_CONFIG)[ProvinceCode]
): number {
  if (!config.surtax) return 0
  const { threshold1, rate1, threshold2, rate2 } = config.surtax
  let surtax = 0
  if (baseTax > threshold1) surtax += (baseTax - threshold1) * rate1
  if (threshold2 !== undefined && rate2 !== undefined && baseTax > threshold2) {
    surtax += (baseTax - threshold2) * rate2
  }
  return surtax
}

export function calculateIncomeTax(income: number, province: ProvinceCode): TaxResult {
  if (income <= 0) {
    return { federalTax: 0, provincialTax: 0, totalTax: 0, effectiveRate: 0, marginalRate: 0, afterTaxIncome: 0 }
  }

  const provConfig = PROVINCE_TAX_CONFIG[province]

  // Federal tax
  let federalTax = applyBrackets(income, FEDERAL_BRACKETS_2025)
  // Federal BPA credit
  const federalBPACredit = Math.min(FEDERAL_BPA_2025, income) * 0.15
  federalTax = Math.max(0, federalTax - federalBPACredit)

  // Quebec abatement: 16.5% reduction on federal tax for QC residents
  if (provConfig.quebecAbatement) {
    federalTax *= 1 - 0.165
  }

  // Provincial tax
  let provincialTax = applyBrackets(income, provConfig.brackets)
  const provBPACredit = Math.min(provConfig.basicPersonalAmount, income) * provConfig.brackets[0].rate
  provincialTax = Math.max(0, provincialTax - provBPACredit)

  // Ontario surtax
  provincialTax += getProvincialSurtax(provincialTax, provConfig)

  const totalTax = federalTax + provincialTax
  const effectiveRate = income > 0 ? totalTax / income : 0

  // Calculate marginal rate (combined federal + provincial at current income)
  const federalMarginal = FEDERAL_BRACKETS_2025.findLast(b => income > b.min)?.rate ?? 0.15
  const provMarginal = provConfig.brackets.findLast(b => income > b.min)?.rate ?? provConfig.brackets[0].rate
  const marginalRate = federalMarginal + provMarginal

  return {
    federalTax,
    provincialTax,
    totalTax,
    effectiveRate,
    marginalRate,
    afterTaxIncome: income - totalTax,
  }
}

export function calculateEligibleDividendTax(
  dividends: number,
  otherIncome: number,
  province: ProvinceCode
): { totalTax: number; effectiveRate: number } {
  if (dividends <= 0) return { totalTax: 0, effectiveRate: 0 }

  const grossedUp = dividends * (1 + FEDERAL_ELIGIBLE_GROSS_UP)
  const totalIncome = otherIncome + grossedUp

  const taxWithDivs = calculateIncomeTax(totalIncome, province)
  const taxWithout = calculateIncomeTax(otherIncome, province)

  const grossedUpDividendIncome = grossedUp - otherIncome

  // Federal DTC
  const federalDTC = grossedUpDividendIncome * FEDERAL_ELIGIBLE_DTC_RATE

  // Provincial DTC
  const provConfig = PROVINCE_TAX_CONFIG[province]
  const provincialDTC = grossedUpDividendIncome * provConfig.eligibleDTCRate

  const incrementalTax = taxWithDivs.totalTax - taxWithout.totalTax
  const netTax = Math.max(0, incrementalTax - federalDTC - provincialDTC)

  return {
    totalTax: netTax,
    effectiveRate: dividends > 0 ? netTax / dividends : 0,
  }
}

// Binary search: find gross income that nets the target after tax
export function grossUpForTax(
  targetAfterTax: number,
  province: ProvinceCode,
  incomeType: "salary" | "dividends" | "mixed" = "salary"
): number {
  if (targetAfterTax <= 0) return 0

  let lo = targetAfterTax
  let hi = targetAfterTax * 3

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    let afterTax: number

    if (incomeType === "salary") {
      afterTax = calculateIncomeTax(mid, province).afterTaxIncome
    } else if (incomeType === "dividends") {
      const divTax = calculateEligibleDividendTax(mid, 0, province)
      afterTax = mid - divTax.totalTax
    } else {
      // mixed: half salary, half eligible dividends
      const salaryPortion = mid * 0.5
      const divPortion = mid * 0.5
      const salaryTax = calculateIncomeTax(salaryPortion, province).totalTax
      const divTax = calculateEligibleDividendTax(divPortion, salaryPortion, province)
      afterTax = mid - salaryTax - divTax.totalTax
    }

    if (Math.abs(afterTax - targetAfterTax) < 1) break
    if (afterTax < targetAfterTax) lo = mid
    else hi = mid
  }

  return (lo + hi) / 2
}

// OAS annual benefit with deferral and inflation indexing
export function calculateOASAnnual(
  startAge: 65 | 66 | 67 | 68 | 69 | 70,
  yearsFromNow: number,
  indexingRate: number
): number {
  const base = OAS_ANNUAL_BY_START_AGE[startAge] ?? OAS_ANNUAL_BY_START_AGE[65]
  return base * Math.pow(1 + indexingRate, yearsFromNow)
}

// OAS clawback: 15 cents per dollar of income above threshold
export function calculateOASClawback(annualIncome: number, oasBenefit: number): number {
  if (annualIncome <= OAS_2025.clawbackThreshold) return 0
  const excess = annualIncome - OAS_2025.clawbackThreshold
  return Math.min(oasBenefit, excess * OAS_2025.clawbackRate)
}

// CPP annual benefit with age adjustment applied to user's age-65 estimate
export function calculateCPPAnnual(
  estimatedMonthlyAt65: number,
  startAge: 60 | 65 | 70
): number {
  const monthlyAt65 = estimatedMonthlyAt65
  let adjusted: number

  if (startAge === 60) {
    // 0.6% reduction per month before 65 = 60 months × 0.6% = 36% reduction
    adjusted = monthlyAt65 * (1 - 60 * CPP_2025.earlyPenaltyPerMonth)
  } else if (startAge === 70) {
    // 0.7% enhancement per month after 65 = 60 months × 0.7% = 42% increase
    adjusted = monthlyAt65 * (1 + 60 * CPP_2025.lateBonusPerMonth)
  } else {
    adjusted = monthlyAt65
  }

  return adjusted * 12
}
