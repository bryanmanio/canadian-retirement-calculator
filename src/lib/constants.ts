import type { ProvinceCode, Assumptions } from "@/types"

export interface TaxBracket {
  min: number
  max: number
  rate: number
}

export interface ProvinceTaxConfig {
  name: string
  brackets: TaxBracket[]
  basicPersonalAmount: number
  eligibleDTCRate: number
  nonEligibleDTCRate: number
  surtax?: {
    threshold1: number
    rate1: number
    threshold2?: number
    rate2?: number
  }
  quebecAbatement?: boolean
}

// ── Federal 2025 ─────────────────────────────────────────────────────────────

export const FEDERAL_BRACKETS_2025: TaxBracket[] = [
  { min: 0,       max: 57_375,   rate: 0.15   },
  { min: 57_375,  max: 114_750,  rate: 0.205  },
  { min: 114_750, max: 158_519,  rate: 0.26   },
  { min: 158_519, max: 220_000,  rate: 0.29   },
  { min: 220_000, max: Infinity, rate: 0.33   },
]

export const FEDERAL_BPA_2025 = 16_129
export const FEDERAL_ELIGIBLE_GROSS_UP = 0.38
export const FEDERAL_ELIGIBLE_DTC_RATE = 0.150198
export const FEDERAL_NON_ELIGIBLE_GROSS_UP = 0.15
export const FEDERAL_NON_ELIGIBLE_DTC_RATE = 0.090301

// ── Provincial 2025 ───────────────────────────────────────────────────────────

export const PROVINCE_TAX_CONFIG: Record<ProvinceCode, ProvinceTaxConfig> = {
  ON: {
    name: "Ontario",
    brackets: [
      { min: 0,        max: 51_446,   rate: 0.0505 },
      { min: 51_446,   max: 102_894,  rate: 0.0915 },
      { min: 102_894,  max: 150_000,  rate: 0.1116 },
      { min: 150_000,  max: 220_000,  rate: 0.1216 },
      { min: 220_000,  max: Infinity, rate: 0.1316 },
    ],
    basicPersonalAmount: 11_141,
    eligibleDTCRate: 0.10,
    nonEligibleDTCRate: 0.029,
    surtax: { threshold1: 5_554, rate1: 0.20, threshold2: 7_108, rate2: 0.36 },
  },
  BC: {
    name: "British Columbia",
    brackets: [
      { min: 0,        max: 45_654,   rate: 0.0506 },
      { min: 45_654,   max: 91_310,   rate: 0.077  },
      { min: 91_310,   max: 104_835,  rate: 0.105  },
      { min: 104_835,  max: 127_299,  rate: 0.1229 },
      { min: 127_299,  max: 172_602,  rate: 0.147  },
      { min: 172_602,  max: 240_716,  rate: 0.168  },
      { min: 240_716,  max: Infinity, rate: 0.205  },
    ],
    basicPersonalAmount: 11_981,
    eligibleDTCRate: 0.12,
    nonEligibleDTCRate: 0.0333,
  },
  AB: {
    name: "Alberta",
    brackets: [
      { min: 0,        max: 148_269,  rate: 0.10   },
      { min: 148_269,  max: 177_922,  rate: 0.12   },
      { min: 177_922,  max: 237_230,  rate: 0.13   },
      { min: 237_230,  max: 355_845,  rate: 0.14   },
      { min: 355_845,  max: Infinity, rate: 0.15   },
    ],
    basicPersonalAmount: 21_870,
    eligibleDTCRate: 0.10,
    nonEligibleDTCRate: 0.0276,
  },
  QC: {
    name: "Quebec",
    brackets: [
      { min: 0,        max: 51_780,   rate: 0.14   },
      { min: 51_780,   max: 103_545,  rate: 0.19   },
      { min: 103_545,  max: 126_000,  rate: 0.24   },
      { min: 126_000,  max: Infinity, rate: 0.2575 },
    ],
    basicPersonalAmount: 17_183,
    eligibleDTCRate: 0.1173,
    nonEligibleDTCRate: 0.0572,
    quebecAbatement: true,
  },
  SK: {
    name: "Saskatchewan",
    brackets: [
      { min: 0,        max: 49_720,   rate: 0.105  },
      { min: 49_720,   max: 142_058,  rate: 0.125  },
      { min: 142_058,  max: Infinity, rate: 0.145  },
    ],
    basicPersonalAmount: 17_661,
    eligibleDTCRate: 0.11,
    nonEligibleDTCRate: 0.035,
  },
  MB: {
    name: "Manitoba",
    brackets: [
      { min: 0,        max: 47_000,   rate: 0.108  },
      { min: 47_000,   max: 100_000,  rate: 0.1275 },
      { min: 100_000,  max: Infinity, rate: 0.174  },
    ],
    basicPersonalAmount: 15_780,
    eligibleDTCRate: 0.08,
    nonEligibleDTCRate: 0.02,
  },
  NB: {
    name: "New Brunswick",
    brackets: [
      { min: 0,        max: 47_715,   rate: 0.094  },
      { min: 47_715,   max: 95_431,   rate: 0.14   },
      { min: 95_431,   max: 176_756,  rate: 0.16   },
      { min: 176_756,  max: Infinity, rate: 0.195  },
    ],
    basicPersonalAmount: 12_458,
    eligibleDTCRate: 0.12,
    nonEligibleDTCRate: 0.03,
  },
  NS: {
    name: "Nova Scotia",
    brackets: [
      { min: 0,        max: 29_590,   rate: 0.0879 },
      { min: 29_590,   max: 59_180,   rate: 0.1495 },
      { min: 59_180,   max: 93_000,   rate: 0.1667 },
      { min: 93_000,   max: 150_000,  rate: 0.175  },
      { min: 150_000,  max: Infinity, rate: 0.21   },
    ],
    basicPersonalAmount: 8_481,
    eligibleDTCRate: 0.0875,
    nonEligibleDTCRate: 0.0267,
  },
  PE: {
    name: "Prince Edward Island",
    brackets: [
      { min: 0,        max: 32_656,   rate: 0.095  },
      { min: 32_656,   max: 64_313,   rate: 0.167  },
      { min: 64_313,   max: 105_000,  rate: 0.18   },
      { min: 105_000,  max: 140_000,  rate: 0.19   },
      { min: 140_000,  max: Infinity, rate: 0.1875 },
    ],
    basicPersonalAmount: 12_000,
    eligibleDTCRate: 0.10,
    nonEligibleDTCRate: 0.025,
  },
  NL: {
    name: "Newfoundland & Labrador",
    brackets: [
      { min: 0,        max: 43_198,   rate: 0.087  },
      { min: 43_198,   max: 86_395,   rate: 0.145  },
      { min: 86_395,   max: 154_244,  rate: 0.158  },
      { min: 154_244,  max: 215_943,  rate: 0.178  },
      { min: 215_943,  max: 275_870,  rate: 0.198  },
      { min: 275_870,  max: 551_739,  rate: 0.208  },
      { min: 551_739,  max: Infinity, rate: 0.218  },
    ],
    basicPersonalAmount: 10_818,
    eligibleDTCRate: 0.05,
    nonEligibleDTCRate: 0.03,
  },
  NT: {
    name: "Northwest Territories",
    brackets: [
      { min: 0,        max: 50_597,   rate: 0.059  },
      { min: 50_597,   max: 101_198,  rate: 0.086  },
      { min: 101_198,  max: 164_525,  rate: 0.122  },
      { min: 164_525,  max: Infinity, rate: 0.1405 },
    ],
    basicPersonalAmount: 16_593,
    eligibleDTCRate: 0.06,
    nonEligibleDTCRate: 0.03,
  },
  NU: {
    name: "Nunavut",
    brackets: [
      { min: 0,        max: 53_268,   rate: 0.04   },
      { min: 53_268,   max: 106_537,  rate: 0.07   },
      { min: 106_537,  max: 173_205,  rate: 0.09   },
      { min: 173_205,  max: Infinity, rate: 0.115  },
    ],
    basicPersonalAmount: 17_925,
    eligibleDTCRate: 0.045,
    nonEligibleDTCRate: 0.02,
  },
  YT: {
    name: "Yukon",
    brackets: [
      { min: 0,        max: 57_375,   rate: 0.064  },
      { min: 57_375,   max: 114_750,  rate: 0.09   },
      { min: 114_750,  max: 500_000,  rate: 0.109  },
      { min: 500_000,  max: Infinity, rate: 0.128  },
    ],
    basicPersonalAmount: 15_705,
    eligibleDTCRate: 0.12,
    nonEligibleDTCRate: 0.0339,
  },
}

// ── OAS 2025 ──────────────────────────────────────────────────────────────────

export const OAS_2025 = {
  maxMonthlyAt65: 727.67,
  deferralBonusPerMonth: 0.006,
  maxDeferralBonus: 0.36,
  clawbackThreshold: 90_997,
  clawbackRate: 0.15,
  fullClawbackAt: 148_451,
}

export function getOASAnnualAt65(): number {
  return OAS_2025.maxMonthlyAt65 * 12
}

export const OAS_ANNUAL_BY_START_AGE: Record<number, number> = {
  65: Math.round(OAS_2025.maxMonthlyAt65 * 12),
  66: Math.round(OAS_2025.maxMonthlyAt65 * 12 * (1 + 12 * OAS_2025.deferralBonusPerMonth)),
  67: Math.round(OAS_2025.maxMonthlyAt65 * 12 * (1 + 24 * OAS_2025.deferralBonusPerMonth)),
  68: Math.round(OAS_2025.maxMonthlyAt65 * 12 * (1 + 36 * OAS_2025.deferralBonusPerMonth)),
  69: Math.round(OAS_2025.maxMonthlyAt65 * 12 * (1 + 48 * OAS_2025.deferralBonusPerMonth)),
  70: Math.round(OAS_2025.maxMonthlyAt65 * 12 * (1 + 60 * OAS_2025.deferralBonusPerMonth)),
}

// ── CPP 2025 ──────────────────────────────────────────────────────────────────

export const CPP_2025 = {
  maxMonthlyAt65: 1_364.60,
  maxAnnualContribution: 3_867.50,
  earlyPenaltyPerMonth: 0.006,
  lateBonusPerMonth: 0.007,
}

// ── RRSP / TFSA 2025 ──────────────────────────────────────────────────────────

export const RRSP_2025 = {
  annualLimit: 32_490,
  rrifConversionAge: 71,
  rrifMinimumRates: {
    71: 0.0528, 72: 0.054, 73: 0.0553, 74: 0.0567, 75: 0.0582,
    76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682,
    81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851,
    86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.20,
  } as Record<number, number>,
}

export const TFSA_2025 = {
  annualRoom: 7_000,
  cumulativeSince2009: 95_000,
}

// ── Scenario defaults ─────────────────────────────────────────────────────────

export const SCENARIO_DEFAULTS = {
  best:    { rate: 0.1386, label: "Best Case (XEQT)",    color: "#22c55e" },
  current: { rate: 0.1095, label: "Current Trajectory",  color: "#3b82f6" },
  worst:   { rate: 0.07,   label: "Worst Case",          color: "#ef4444" },
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  inflationRate: 0.025,
  oasIndexingRate: 0.02,
  withdrawalRate: 0.04,
  scenarioReturns: { best: 0.1386, current: 0.1095, worst: 0.07 },
  stdDev: 0.12,
  monteCarloSimulations: 500,
}

export const PROVINCE_NAMES: Record<ProvinceCode, string> = Object.fromEntries(
  Object.entries(PROVINCE_TAX_CONFIG).map(([k, v]) => [k, v.name])
) as Record<ProvinceCode, string>

export const ACCOUNT_CATEGORY_LABELS: Record<string, string> = {
  tfsa: "TFSA",
  rrsp: "RRSP",
  lira: "LIRA",
  nonRegistered: "Non-Registered (Personal)",
  corporateInvestment: "Corporate Investment",
  corporateSavings: "Corporate Savings",
  fhsa: "FHSA",
  rdsp: "RDSP",
  cash: "Cash / Chequing (exclude)",
  ignore: "Ignore this account",
}
