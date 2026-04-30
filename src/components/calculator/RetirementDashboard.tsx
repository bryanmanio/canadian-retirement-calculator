"use client"

import { useMemo, useState } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios, calculateRetirementReadiness } from "@/lib/retirement"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatPercent, getStatusColor, getStatusBg } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function MetricCard({
  label,
  value,
  sub,
  ratio,
  tooltip,
  size = "md",
}: {
  label: string
  value: string
  sub?: string
  ratio?: number
  tooltip: string
  size?: "sm" | "md"
}) {
  const color = ratio !== undefined ? getStatusColor(ratio) : ""
  const bg = ratio !== undefined ? getStatusBg(ratio) : ""

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={cn("border cursor-help", bg)}>
            <CardContent className={size === "sm" ? "p-3" : "p-4"}>
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className={cn(
                "font-bold tabular-nums",
                size === "sm" ? "text-lg" : "text-2xl",
                color
              )}>{value}</div>
              {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function RetirementDashboard() {
  const state = useCalculatorStore()
  const [expanded, setExpanded] = useState(false)

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
    <div className="print-section space-y-3">
      {/* Primary metrics — 3 large cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Years to retirement"
          value={readiness.yearsToRetirement <= 0 ? "Retired ✓" : String(readiness.yearsToRetirement)}
          sub={`Target age ${state.targetRetirementAge}`}
          tooltip="Years until your target retirement age."
        />
        <MetricCard
          label="Coverage"
          value={formatPercent(readiness.fundingRatio)}
          ratio={readiness.fundingRatio}
          sub={readiness.surplusOrDeficit >= 0
            ? `+${formatCurrency(readiness.surplusOrDeficit, true)} surplus`
            : `${formatCurrency(readiness.surplusOrDeficit, true)} short`}
          tooltip="How much of your retirement target your projected portfolio will cover. 100%+ means you're fully funded."
        />
        <MetricCard
          label={isOnTrack ? "Status" : "Monthly gap"}
          value={isOnTrack ? "On track ✓" : formatCurrency(monthlySavings / 12)}
          ratio={isOnTrack ? 1.5 : monthlySavings < 1000 ? 0.9 : 0.5}
          sub={isOnTrack ? "No gap to close" : "Additional needed/mo"}
          tooltip="Additional monthly savings required (beyond current contributions) to reach your portfolio target by retirement."
        />
      </div>

      {/* Banner */}
      {!isOnTrack && readiness.yearsToRetirement > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-2.5 text-sm">
          <span className="text-red-700 dark:text-red-400">
            Save <strong>{formatCurrency(readiness.additionalMonthlySavingsNeeded)}/mo</strong> more to retire at {state.targetRetirementAge}.
          </span>
        </div>
      )}

      {/* Toggle for detailed metrics */}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-7 text-muted-foreground"
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", expanded && "rotate-180")} />
        {expanded ? "Hide" : "Show"} details
      </Button>

      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <MetricCard
            label="Portfolio today"
            value={formatCurrency(readiness.portfolioToday, true)}
            tooltip="Sum of all portfolio balances entered (TFSA + RRSP + non-reg + corporate + other)."
            size="sm"
          />
          <MetricCard
            label="Projected at retirement"
            value={formatCurrency(readiness.projectedAtRetirement, true)}
            tooltip="Estimated portfolio value at your retirement age (in today's dollars, inflation-adjusted)."
            size="sm"
          />
          <MetricCard
            label="Required portfolio"
            value={formatCurrency(readiness.requiredPortfolio, true)}
            tooltip="Portfolio size needed at retirement to fund your target income at your safe withdrawal rate."
            size="sm"
          />
          <MetricCard
            label="Effective tax rate"
            value={formatPercent(readiness.effectiveTaxRate)}
            sub={`${state.province} at target income`}
            tooltip="Combined federal + provincial effective tax rate at your target retirement income level."
            size="sm"
          />
        </div>
      )}
    </div>
  )
}
