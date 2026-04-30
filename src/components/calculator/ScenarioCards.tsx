"use client"

import { useMemo, useState } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios, calculateRetirementReadiness } from "@/lib/retirement"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { SCENARIO_DEFAULTS } from "@/lib/constants"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScenarioCardProps {
  id: "best" | "current" | "worst"
  rate: number
  onRateChange: (rate: number) => void
}

function ScenarioCard({ id, rate, onRateChange }: ScenarioCardProps) {
  const state = useCalculatorStore()
  const config = SCENARIO_DEFAULTS[id]
  const [showDetails, setShowDetails] = useState(false)

  const params = {
    currentAge: state.currentAge,
    targetRetirementAge: state.targetRetirementAge,
    province: state.province,
    balances: state.balances,
    contributions: state.contributions,
    target: state.target,
    benefits: state.benefits,
    assumptions: { ...state.assumptions, scenarioReturns: { ...state.assumptions.scenarioReturns, [id]: rate } },
  }

  const readiness = useMemo(() => {
    const scenarios = computeAllScenarios(params)
    const projections = id === "best" ? scenarios.best : id === "worst" ? scenarios.worst : scenarios.current
    return calculateRetirementReadiness(projections, params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentAge, state.targetRetirementAge, state.province, state.balances, state.contributions, state.target, state.benefits, state.assumptions, rate, id])

  const isOnTrack = readiness.fundingRatio >= 1.0
  const sustainableIncome = readiness.projectedAtRetirement * state.assumptions.withdrawalRate

  const accent =
    id === "best" ? "border-green-500/30" :
    id === "current" ? "border-blue-500/30" :
    "border-red-500/30"

  const dotColor =
    id === "best" ? "bg-green-500" :
    id === "current" ? "bg-blue-500" :
    "bg-red-500"

  return (
    <Card
      className={cn("border-l-4 cursor-pointer transition-all hover:shadow-md", accent)}
      onClick={() => setShowDetails(s => !s)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: name + dot + return rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", dotColor)} />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
          <div className="flex items-center text-xs" onClick={e => e.stopPropagation()}>
            <Input
              className="h-6 w-12 text-right text-xs px-1"
              value={(rate * 100).toFixed(2)}
              onChange={e => {
                const n = parseFloat(e.target.value)
                if (!isNaN(n) && n >= 0 && n <= 30) onRateChange(n / 100)
              }}
            />
            <span className="text-muted-foreground ml-0.5">%</span>
          </div>
        </div>

        {/* Primary: portfolio + on-track */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Projected</div>
            <div className="text-xl font-bold tabular-nums">{formatCurrency(readiness.projectedAtRetirement, true)}</div>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold",
            isOnTrack ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {isOnTrack ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {formatPercent(readiness.fundingRatio)}
          </div>
        </div>

        {/* Expandable details */}
        {showDetails && (
          <div className="space-y-1 pt-2 border-t text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required</span>
              <span className="tabular-nums">{formatCurrency(readiness.requiredPortfolio, true)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sustainable income</span>
              <span className="tabular-nums">{formatCurrency(sustainableIncome, true)}/yr</span>
            </div>
            {!isOnTrack && (
              <div className="flex justify-between">
                <span className="text-red-500/80">Monthly gap</span>
                <span className="text-red-500 tabular-nums">+{formatCurrency(readiness.additionalMonthlySavingsNeeded)}/mo</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ScenarioCards() {
  const { assumptions, setScenarioReturn } = useCalculatorStore()

  return (
    <div>
      <TooltipProvider>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scenarios</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground/60 cursor-help">(click to expand)</span>
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-xs">
              Three projections at different return rates. Click any card to see required portfolio, sustainable income, and gap.
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScenarioCard id="best" rate={assumptions.scenarioReturns.best} onRateChange={r => setScenarioReturn("best", r)} />
        <ScenarioCard id="current" rate={assumptions.scenarioReturns.current} onRateChange={r => setScenarioReturn("current", r)} />
        <ScenarioCard id="worst" rate={assumptions.scenarioReturns.worst} onRateChange={r => setScenarioReturn("worst", r)} />
      </div>
    </div>
  )
}
