"use client"

import { useMemo } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios, calculateRequiredPortfolio } from "@/lib/retirement"
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-popover p-3 shadow-md text-xs space-y-1">
      <div className="font-semibold mb-1">Age {label}</div>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{formatCurrency(entry.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-2">
      {payload.map((entry: { value: string; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  )
}

export function ProjectionsChart() {
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

  const { scenarios, requiredPortfolio, chartData, monteCarloData } = useMemo(() => {
    const scenarios = computeAllScenarios(params)
    const requiredPortfolio = calculateRequiredPortfolio(params)

    const chartData = scenarios.current.map((row, i) => ({
      age: row.age,
      best: Math.round(scenarios.best[i].portfolioValue),
      current: Math.round(scenarios.current[i].portfolioValue),
      worst: Math.round(scenarios.worst[i].portfolioValue),
      ...(state.monteCarloResults && state.monteCarloEnabled ? {
        mc_p10: Math.round(state.monteCarloResults.p10[i] ?? 0),
        mc_p90: Math.round(state.monteCarloResults.p90[i] ?? 0),
      } : {}),
    }))

    const monteCarloData = state.monteCarloEnabled && state.monteCarloResults
      ? chartData.map((d, i) => ({
          ...d,
          band: [
            state.monteCarloResults!.p10[i] ?? 0,
            state.monteCarloResults!.p90[i] ?? 0,
          ],
        }))
      : null

    return { scenarios, requiredPortfolio, chartData, monteCarloData }
  }, [params, state.monteCarloResults, state.monteCarloEnabled])

  void scenarios

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Portfolio Projections</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="age"
              tickLine={false}
              tick={{ fontSize: 11 }}
              label={{ value: "Age", position: "insideBottom", offset: -5, fontSize: 11 }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tickLine={false}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />

            {/* Monte Carlo band */}
            {monteCarloData && (
              <Area
                data={monteCarloData}
                dataKey="band"
                name="MC 10–90th %ile"
                fill="#3b82f6"
                stroke="none"
                fillOpacity={0.12}
                legendType="square"
              />
            )}

            {/* Retirement reference line */}
            <ReferenceLine
              x={state.targetRetirementAge}
              stroke="#6b7280"
              strokeDasharray="4 4"
              label={{ value: `Retire ${state.targetRetirementAge}`, position: "insideTopLeft", fontSize: 10, fill: "#6b7280" }}
            />

            {/* Required portfolio threshold */}
            <ReferenceLine
              y={requiredPortfolio}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: `Target: ${formatCurrency(requiredPortfolio, true)}`, position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
            />

            <Line
              type="monotone"
              dataKey="best"
              name="Best Case (XEQT)"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              legendType="square"
            />
            <Line
              type="monotone"
              dataKey="current"
              name="Current Trajectory"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              legendType="square"
            />
            <Line
              type="monotone"
              dataKey="worst"
              name="Worst Case"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="2 4"
              dot={false}
              legendType="square"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
