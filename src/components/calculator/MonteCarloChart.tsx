"use client"

import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios } from "@/lib/retirement"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function MonteCarloChart() {
  const state = useCalculatorStore()

  const params = useMemo(() => ({
    currentAge: state.currentAge,
    targetRetirementAge: state.targetRetirementAge,
    province: state.province,
    balances: state.balances,
    contributions: state.contributions,
    target: state.target,
    benefits: state.benefits,
    assumptions: state.assumptions,
  }), [state.currentAge, state.targetRetirementAge, state.province, state.balances, state.contributions, state.target, state.benefits, state.assumptions])

  const currentProjection = useMemo(() => {
    const s = computeAllScenarios(params)
    return s.current
  }, [params])

  const chartData = useMemo(() => {
    if (!state.monteCarloResults) return []
    return state.monteCarloResults.years.map((_, i) => ({
      age: state.currentAge + i,
      p10: Math.round(state.monteCarloResults!.p10[i]),
      p25: Math.round(state.monteCarloResults!.p25[i]),
      p50: Math.round(state.monteCarloResults!.p50[i]),
      p75: Math.round(state.monteCarloResults!.p75[i]),
      p90: Math.round(state.monteCarloResults!.p90[i]),
      current: Math.round(currentProjection[i]?.portfolioValue ?? 0),
    }))
  }, [state.monteCarloResults, state.currentAge, currentProjection])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Monte Carlo Simulation</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="mc-toggle" className="text-xs text-muted-foreground">Show simulation</Label>
            <Switch
              id="mc-toggle"
              checked={state.monteCarloEnabled}
              onCheckedChange={state.toggleMonteCarlo}
            />
          </div>
        </div>
      </CardHeader>

      {state.monteCarloEnabled && (
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={state.runMonteCarlo}
              disabled={state.monteCarloRunning}
            >
              {state.monteCarloRunning ? "Running..." : "Run Simulation"}
            </Button>
            {state.monteCarloResults && (
              <>
                <Badge variant="secondary" className="text-xs">
                  {state.assumptions.monteCarloSimulations} simulations
                </Badge>
                <Badge
                  className={`text-xs ${
                    state.monteCarloResults.successRate >= 0.9
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : state.monteCarloResults.successRate >= 0.7
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                  }`}
                >
                  {(state.monteCarloResults.successRate * 100).toFixed(0)}% success rate
                </Badge>
                <span className="text-xs text-muted-foreground">
                  (portfolio lasts to age 90)
                </span>
              </>
            )}
          </div>

          {state.monteCarloRunning && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!state.monteCarloRunning && state.monteCarloResults && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="age" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatYAxis} tickLine={false} tick={{ fontSize: 11 }} width={60} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [formatCurrency(Number(value), true), String(name)]}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <ReferenceLine
                  x={state.targetRetirementAge}
                  stroke="#6b7280"
                  strokeDasharray="4 4"
                />
                {/* Shaded bands */}
                <Area type="monotone" dataKey="p90" name="90th %ile" stroke="none" fill="#3b82f6" fillOpacity={0.08} />
                <Area type="monotone" dataKey="p75" name="75th %ile" stroke="none" fill="#3b82f6" fillOpacity={0.10} />
                <Area type="monotone" dataKey="p50" name="Median" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.15} />
                <Area type="monotone" dataKey="p25" name="25th %ile" stroke="none" fill="#ffffff" fillOpacity={0.5} />
                <Area type="monotone" dataKey="p10" name="10th %ile" stroke="none" fill="#ffffff" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {!state.monteCarloRunning && !state.monteCarloResults && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Click &quot;Run Simulation&quot; to generate 500 randomized retirement paths
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            500 simulations using a normal distribution (mean = current return rate, std dev = {(state.assumptions.stdDev * 100).toFixed(0)}%).
            Shaded bands show 10th–90th percentile range.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
