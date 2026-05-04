export type ProvinceCode =
  | "AB" | "BC" | "MB" | "NB" | "NL"
  | "NS" | "NT" | "NU" | "ON" | "PE"
  | "QC" | "SK" | "YT"

export type AccountCategory =
  | "tfsa" | "rrsp" | "lira" | "nonRegistered"
  | "corporateInvestment" | "corporateSavings"
  | "fhsa" | "rdsp" | "cash" | "ignore"

export interface PortfolioBalances {
  tfsa: number
  rrsp: number
  nonRegistered: number
  corporateInvestment: number
  otherSavings: number
}

export interface Contributions {
  tfsa: number
  rrsp: number
  nonRegistered: number
  corporate: number
}

export interface GovernmentBenefits {
  includeOAS: boolean
  oasStartAge: 65 | 66 | 67 | 68 | 69 | 70
  includeCPP: boolean
  cppStartAge: 60 | 65 | 70
  estimatedMonthlyCPP: number
}

export interface RetirementTarget {
  annualIncome: number
  incomeType: "salary" | "dividends" | "mixed"
  withdrawalStructure: "personal-first" | "corporate-first" | "blended"
}

export interface Assumptions {
  inflationRate: number
  oasIndexingRate: number
  withdrawalRate: number
  scenarioReturns: {
    best: number
    current: number
    worst: number
  }
  // Post-retirement nominal return (assumes de-risking to ~60/40 portfolio).
  // Used instead of scenarioReturns once isRetired === true.
  postRetirementReturn: number
  stdDev: number
  monteCarloSimulations: number
}

export interface RetirementProjection {
  year: number
  age: number
  portfolioValue: number
  annualContribution: number
  annualWithdrawal: number
  oasIncome: number
  cppIncome: number
  taxOwed: number
  netIncome: number
  requiredPortfolio: number
}

export interface WithdrawalBreakdown {
  label: string
  age: number
  tfsaWithdrawal: number
  rrspWithdrawal: number
  nonRegWithdrawal: number
  oasIncome: number
  cppIncome: number
  taxOwed: number
  oasClawback: number
  totalGross: number
  totalNet: number
}

export interface MonteCarloResult {
  years: number[]
  p10: number[]
  p25: number[]
  p50: number[]
  p75: number[]
  p90: number[]
  successRate: number
}

export interface LunchMoneyAccount {
  id: number | string
  name: string
  type_name?: string
  subtype_name?: string
  display_name?: string
  balance: string
  currency: string
  institution_name?: string
  closed_on?: string | null
  exclude_transactions?: boolean
}

export interface TaxResult {
  federalTax: number
  provincialTax: number
  totalTax: number
  effectiveRate: number
  marginalRate: number
  afterTaxIncome: number
}

export interface RetirementReadiness {
  yearsToRetirement: number
  portfolioToday: number
  projectedAtRetirement: number
  requiredPortfolio: number
  surplusOrDeficit: number
  fundingRatio: number
  additionalMonthlySavingsNeeded: number
  projectedMonthlyIncome: number
  oasCoveragePercent: number
  effectiveTaxRate: number
}

export interface ProjectionParams {
  currentAge: number
  targetRetirementAge: number
  province: ProvinceCode
  balances: PortfolioBalances
  contributions: Contributions
  target: RetirementTarget
  benefits: GovernmentBenefits
  assumptions: Assumptions
}

export interface ScenarioProjections {
  best: RetirementProjection[]
  current: RetirementProjection[]
  worst: RetirementProjection[]
}

export interface MonteCarloParams {
  currentPortfolio: number
  annualContribution: number
  annualGrossWithdrawal: number
  mean: number
  stdDev: number
  yearsToRetirement: number
  yearsInRetirement: number
  inflationRate: number
  simulations: number
}
