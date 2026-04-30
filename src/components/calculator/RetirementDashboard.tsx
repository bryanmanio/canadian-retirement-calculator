"use client"

import { useMemo } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios, calculateRetirementReadiness } from "@/lib/retirement"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatPercent, getStatusColor, getStatusBg } from "@/lib/utils"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

function MetricCard({
  label,
  value,
  sub,
  ratio,
  tooltip,
}: {
  label: string
  value: string
  sub?: string
  ratio?: number
  tooltip: string
}) {
  const color = ratio !== undefined ? getStatusColor(ratio) : ""
  const bg = ratio !== undefined ? getStatusBg(ratio) : ""

  return (
    <Card className={cn("border", bg)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          {label}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={cn("text-2xl font-bold tabular-nums", color)}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function RetirementDashboard() {
  const state = useCalculatorStore()

  const readiness = useMemo(() => {
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
    const scenarios = computeAllScenarios(params)
    return calculateRetirementReadiness(scenarios.current, params)
  }, [
    state.currentAge, state.targetRetirementAge, state.province,
    state.balances, state.contributions, state.target,
    state.benefits, state.assumptions,
  ])

  const monthlySavings = readiness.additionalMonthlySavingsNeeded
  const isOnTrack = readiness.fundingRatio >= 1.0

  return (
    <div className="print-section">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Years to Retirement"
          value={readiness.yearsToRetirement <= 0 ? "Retired!" : String(readiness.yearsToRetirement)}
          sub={`Target age ${state.targetRetirementAge}`}
          tooltip="Years until your target retirement age."
        />
        <MetricCard
          label="Portfolio Today"
          value={formatCurrency(readiness.portfolioToday, true)}
          sub="Total across all accounts"
          tooltip="Sum of all portfolio balances you've entered (TFSA + RRSP + non-reg + corporate + other)."
        />
        <MetricCard
          label="Projected at Retirement"
          value={formatCurrency(readiness.projectedAtRetirement, true)}
          ratio={readiness.fundingRatio}
          sub={`Need ${formatCurrency(readiness.requiredPortfolio, true)}`}
          tooltip="Estimated portfolio value at your retirement age using your current trajectory return rate."
        />
        <MetricCard
          label="Monthly Savings Needed"
          value={isOnTrack ? "On track ✓" : formatCurrency(monthlySavings / 12)}
          sub={isOnTrack ? "No gap to close" : "Additional per month"}
          ratio={isOnTrack ? 1.5 : monthlySavings < 1000 ? 0.9 : 0.5}
          tooltip="Additional monthly savings required (beyond current contributions) to reach your portfolio target by retirement."
        />
        <MetricCard
          label="Income Coverage"
          value={formatPercent(readiness.fundingRatio)}
          ratio={readiness.fundingRatio}
          sub={readiness.surplusOrDeficit >= 0
            ? `+${formatCurrency(readiness.surplusOrDeficit, true)} surplus`
            : `${formatCurrency(readiness.surplusOrDeficit, true)} shortfall`}
          tooltip="How much of your retirement income target is covered by your projected portfolio. 100%+ means fully funded."
        />
        <MetricCard
          label="Effective Tax Rate"
          value={formatPercent(readiness.effectiveTaxRate)}
          sub={`in ${state.province} at target income`}
          tooltip="Combined federal + provincial effective tax rate at your target retirement income level in your selected province."
        />
      </div>

      {/* Retirement savings gap banner */}
      {!isOnTrack && readiness.yearsToRetirement > 0 && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-3 text-sm">
          <span className="font-semibold text-red-700 dark:text-red-400">Retirement gap: </span>
          <span className="text-red-600 dark:text-red-400">
            To retire at age {state.targetRetirementAge}, you need{" "}
            <strong>{formatCurrency(readiness.additionalMonthlySavingsNeeded)}/month</strong> in additional savings, or a portfolio of{" "}
            <strong>{formatCurrency(readiness.requiredPortfolio, true)}</strong> ({formatCurrency(readiness.surplusOrDeficit, true)} shortfall).
          </span>
        </div>
      )}
      {isOnTrack && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 px-4 py-3 text-sm">
          <span className="font-semibold text-green-700 dark:text-green-400">On track ✓ </span>
          <span className="text-green-600 dark:text-green-400">
            Your current savings trajectory projects a{" "}
            <strong>{formatCurrency(readiness.surplusOrDeficit, true)} surplus</strong> over your target at age {state.targetRetirementAge}.
          </span>
        </div>
      )}
    </div>
  )
}
