"use client"

import { useMemo } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios, calculateRetirementReadiness } from "@/lib/retirement"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { SCENARIO_DEFAULTS } from "@/lib/constants"
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScenarioCardProps {
  id: "best" | "current" | "worst"
  rate: number
  onRateChange: (rate: number) => void
}

function ScenarioCard({ id, rate, onRateChange }: ScenarioCardProps) {
  const state = useCalculatorStore()
  const config = SCENARIO_DEFAULTS[id]

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

  const borderColor =
    id === "best" ? "border-green-200 dark:border-green-800" :
    id === "current" ? "border-blue-200 dark:border-blue-800" :
    "border-red-200 dark:border-red-800"

  const headerColor =
    id === "best" ? "text-green-600 dark:text-green-400" :
    id === "current" ? "text-blue-600 dark:text-blue-400" :
    "text-red-600 dark:text-red-400"

  return (
    <Card className={cn("border-2", borderColor)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", headerColor)}>
          <TrendingUp className="h-4 w-4" />
          {config.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Return rate input */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Annual return:</Label>
          <div className="flex items-center">
            <Input
              className="h-6 w-16 text-right text-xs px-1"
              value={(rate * 100).toFixed(2)}
              onChange={e => {
                const n = parseFloat(e.target.value)
                if (!isNaN(n) && n >= 0 && n <= 30) onRateChange(n / 100)
              }}
            />
            <span className="text-xs text-muted-foreground ml-1">%</span>
          </div>
        </div>

        {/* Status indicator */}
        <div className={cn(
          "flex items-center gap-1.5 text-sm font-semibold",
          isOnTrack ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {isOnTrack ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {isOnTrack ? "On track" : "Behind"}
        </div>

        {/* Metrics */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Projected portfolio</span>
            <span className="font-medium tabular-nums">{formatCurrency(readiness.projectedAtRetirement, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required</span>
            <span className="tabular-nums">{formatCurrency(readiness.requiredPortfolio, true)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sustainable income</span>
            <span className="tabular-nums">{formatCurrency(sustainableIncome, true)}/yr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage</span>
            <span className={cn("font-medium tabular-nums", isOnTrack ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              {formatPercent(readiness.fundingRatio)}
            </span>
          </div>
          {!isOnTrack && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly gap</span>
              <span className="text-red-600 dark:text-red-400 tabular-nums">
                +{formatCurrency(readiness.additionalMonthlySavingsNeeded)}/mo
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ScenarioCards() {
  const { assumptions, setScenarioReturn } = useCalculatorStore()

  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Scenarios</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScenarioCard id="best" rate={assumptions.scenarioReturns.best} onRateChange={r => setScenarioReturn("best", r)} />
        <ScenarioCard id="current" rate={assumptions.scenarioReturns.current} onRateChange={r => setScenarioReturn("current", r)} />
        <ScenarioCard id="worst" rate={assumptions.scenarioReturns.worst} onRateChange={r => setScenarioReturn("worst", r)} />
      </div>
    </div>
  )
}
