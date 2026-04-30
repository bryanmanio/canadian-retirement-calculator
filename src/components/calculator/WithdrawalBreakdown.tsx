"use client"

import { useMemo } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios, computeWithdrawalBreakdown } from "@/lib/retirement"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = {
  tfsa: "#6366f1",
  rrsp: "#ef4444",
  nonReg: "#f97316",
  oas: "#22c55e",
  cpp: "#14b8a6",
  tax: "#9ca3af",
  clawback: "#dc2626",
}

function formatYAxis(value: number): string {
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {payload.map((entry: { value: string; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  )
}

export function WithdrawalBreakdown() {
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

  const breakdowns = useMemo(() => {
    const scenarios = computeAllScenarios(params)
    return computeWithdrawalBreakdown(scenarios.current, params)
  }, [params])

  const chartData = breakdowns.map(b => ({
    name: b.label,
    "TFSA": Math.round(b.tfsaWithdrawal),
    "RRSP/RRIF": Math.round(b.rrspWithdrawal),
    "Non-Reg": Math.round(b.nonRegWithdrawal),
    "OAS": Math.round(b.oasIncome),
    "CPP": Math.round(b.cppIncome),
    "Tax": Math.round(b.taxOwed),
  }))

  // Optimal order recommendation
  const orderData = [
    { name: "Step 1", source: "Non-Reg First", reason: "Use up capital gains room, avoid OAS clawback", color: COLORS.nonReg },
    { name: "Step 2", source: "RRSP / RRIF", reason: "Mandatory RRIF minimums after age 71", color: COLORS.rrsp },
    { name: "Step 3", source: "TFSA Last", reason: "Tax-free, no OAS clawback, no income test", color: COLORS.tfsa },
  ]

  if (breakdowns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Withdrawal Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Set a retirement age in the future to see withdrawal breakdown.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Withdrawal Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stacked bar chart */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} tickLine={false} width={60} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatCurrency(Number(value)), String(name)]}
            />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="TFSA" stackId="a" fill={COLORS.tfsa} />
            <Bar dataKey="RRSP/RRIF" stackId="a" fill={COLORS.rrsp} />
            <Bar dataKey="Non-Reg" stackId="a" fill={COLORS.nonReg} />
            <Bar dataKey="OAS" stackId="a" fill={COLORS.oas} />
            <Bar dataKey="CPP" stackId="a" fill={COLORS.cpp} />
            <Bar dataKey="Tax" stackId="a" fill={COLORS.tax} />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary table */}
        {breakdowns.map(b => (
          <div key={b.label} className="text-sm space-y-1">
            <div className="font-semibold">{b.label}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              {b.tfsaWithdrawal > 0 && <><span className="text-muted-foreground">TFSA withdrawal</span><span className="tabular-nums">{formatCurrency(b.tfsaWithdrawal)}</span></>}
              {b.rrspWithdrawal > 0 && <><span className="text-muted-foreground">RRSP/RRIF withdrawal</span><span className="tabular-nums">{formatCurrency(b.rrspWithdrawal)}</span></>}
              {b.nonRegWithdrawal > 0 && <><span className="text-muted-foreground">Non-reg withdrawal</span><span className="tabular-nums">{formatCurrency(b.nonRegWithdrawal)}</span></>}
              {b.oasIncome > 0 && <><span className="text-muted-foreground">OAS income</span><span className="tabular-nums text-green-600 dark:text-green-400">{formatCurrency(b.oasIncome)}</span></>}
              {b.cppIncome > 0 && <><span className="text-muted-foreground">CPP income</span><span className="tabular-nums text-teal-600 dark:text-teal-400">{formatCurrency(b.cppIncome)}</span></>}
              {b.oasClawback > 0 && <><span className="text-muted-foreground text-red-500">OAS clawback</span><span className="tabular-nums text-red-500">−{formatCurrency(b.oasClawback)}</span></>}
              <span className="text-muted-foreground">Estimated tax</span><span className="tabular-nums text-muted-foreground">−{formatCurrency(b.taxOwed)}</span>
              <span className="font-medium border-t pt-0.5">Net income</span><span className="tabular-nums font-medium border-t pt-0.5">{formatCurrency(b.totalNet)}</span>
            </div>
          </div>
        ))}

        {/* Optimal order recommendation */}
        <div>
          <div className="text-sm font-semibold mb-2">Optimal withdrawal order</div>
          <div className="space-y-2">
            {orderData.map(step => (
              <div key={step.name} className="flex items-start gap-3 text-xs">
                <span className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" style={{ background: step.color }} />
                <div>
                  <span className="font-medium">{step.source}</span>
                  <span className="text-muted-foreground ml-1">— {step.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Suppress unused import warning
void Cell
