import type { MonteCarloParams, MonteCarloResult } from "@/types"

function boxMuller(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function sampleReturn(mean: number, stdDev: number): number {
  const z = boxMuller()
  return Math.max(-0.5, Math.min(1.0, mean + stdDev * z))
}

export function runSimulations(params: MonteCarloParams): MonteCarloResult {
  const {
    currentPortfolio,
    annualContribution,
    annualGrossWithdrawal,
    mean,
    stdDev,
    yearsToRetirement,
    yearsInRetirement,
    inflationRate,
    simulations,
  } = params

  const totalYears = yearsToRetirement + yearsInRetirement
  const allResults: number[][] = []
  let successCount = 0

  for (let sim = 0; sim < simulations; sim++) {
    let portfolio = currentPortfolio
    const yearlyValues: number[] = [portfolio]

    for (let year = 1; year <= totalYears; year++) {
      const r = sampleReturn(mean, stdDev)

      if (year <= yearsToRetirement) {
        portfolio = (portfolio + annualContribution / 2) * (1 + r) + annualContribution / 2
      } else {
        const yearsRetired = year - yearsToRetirement
        const withdrawal = annualGrossWithdrawal * Math.pow(1 + inflationRate, yearsRetired - 1)
        portfolio = Math.max(0, (portfolio - withdrawal / 2) * (1 + r) - withdrawal / 2)
      }

      yearlyValues.push(portfolio)
    }

    allResults.push(yearlyValues)
    if (portfolio > 0) successCount++
  }

  // Compute percentiles at each year
  const years: number[] = Array.from({ length: totalYears + 1 }, (_, i) => i)
  const p10: number[] = []
  const p25: number[] = []
  const p50: number[] = []
  const p75: number[] = []
  const p90: number[] = []

  for (let year = 0; year <= totalYears; year++) {
    const vals = allResults.map(r => r[year]).sort((a, b) => a - b)
    p10.push(percentile(vals, 10))
    p25.push(percentile(vals, 25))
    p50.push(percentile(vals, 50))
    p75.push(percentile(vals, 75))
    p90.push(percentile(vals, 90))
  }

  return {
    years,
    p10,
    p25,
    p50,
    p75,
    p90,
    successRate: successCount / simulations,
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}
