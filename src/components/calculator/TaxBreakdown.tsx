"use client"

import { useMemo } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { calculateIncomeTax, grossUpForTax, calculateOASAnnual, calculateCPPAnnual } from "@/lib/tax"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { PROVINCE_NAMES, SCENARIO_DEFAULTS } from "@/lib/constants"
import type { ProvinceCode } from "@/types"

function TaxRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${highlight ? "font-semibold border-t pt-1 mt-1" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function TaxCard({ returnRate, label }: { returnRate: number; label: string }) {
  const state = useCalculatorStore()

  const calc = useMemo(() => {
    const yearsToRetirement = state.targetRetirementAge - state.currentAge

    const oasAnnual = state.benefits.includeOAS
      ? calculateOASAnnual(state.benefits.oasStartAge, yearsToRetirement, state.assumptions.oasIndexingRate)
      : 0

    const cppAnnual = state.benefits.includeCPP
      ? calculateCPPAnnual(state.benefits.estimatedMonthlyCPP, state.benefits.cppStartAge) *
        Math.pow(1 + state.assumptions.oasIndexingRate, Math.max(0, yearsToRetirement))
      : 0

    const govIncome = oasAnnual + cppAnnual
    const targetNet = state.target.annualIncome
    const incomeGap = Math.max(0, targetNet - govIncome)

    const grossWithdrawal = grossUpForTax(incomeGap, state.province, state.target.incomeType)
    const grossTotal = grossWithdrawal + govIncome

    const taxResult = calculateIncomeTax(grossTotal, state.province)

    // Pre-65 (no OAS/CPP from portfolio perspective)
    const pre65Gross = grossUpForTax(targetNet, state.province, state.target.incomeType)
    const pre65Tax = calculateIncomeTax(pre65Gross, state.province)

    void returnRate

    return {
      oasAnnual,
      cppAnnual,
      govIncome,
      grossWithdrawal,
      grossTotal,
      taxResult,
      pre65Gross,
      pre65Tax,
    }
  }, [state, returnRate])

  return (
    <div className="space-y-4">
      {/* Pre-65 (no gov benefits from portfolio perspective) */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Pre-65 (no OAS/CPP)
        </div>
        <div className="space-y-1">
          <TaxRow label="Target net income" value={formatCurrency(state.target.annualIncome)} />
          <TaxRow label="Gross withdrawal needed" value={formatCurrency(calc.pre65Gross)} />
          <TaxRow label="Federal tax" value={formatCurrency(calc.pre65Tax.federalTax)} />
          <TaxRow label="Provincial tax (ON)" value={formatCurrency(calc.pre65Tax.provincialTax)} />
          <TaxRow label="Total tax" value={formatCurrency(calc.pre65Tax.totalTax)} />
          <TaxRow label="Effective tax rate" value={formatPercent(calc.pre65Tax.effectiveRate)} highlight />
        </div>
      </div>

      {/* Post-65 (with OAS/CPP reducing portfolio draw) */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Post-65 (with OAS + CPP)
        </div>
        <div className="space-y-1">
          <TaxRow label="Target net income" value={formatCurrency(state.target.annualIncome)} />
          {calc.oasAnnual > 0 && <TaxRow label="OAS income" value={`− ${formatCurrency(calc.oasAnnual)}`} />}
          {calc.cppAnnual > 0 && <TaxRow label="CPP income" value={`− ${formatCurrency(calc.cppAnnual)}`} />}
          <TaxRow label="Portfolio draw needed" value={formatCurrency(calc.grossWithdrawal)} />
          <TaxRow label="Federal tax" value={formatCurrency(calc.taxResult.federalTax)} />
          <TaxRow label="Provincial tax" value={formatCurrency(calc.taxResult.provincialTax)} />
          <TaxRow label="Total tax" value={formatCurrency(calc.taxResult.totalTax)} />
          <TaxRow label="Effective tax rate" value={formatPercent(calc.taxResult.effectiveRate)} highlight />
          <TaxRow label="Marginal rate" value={formatPercent(calc.taxResult.marginalRate)} />
        </div>
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t">
        Province: {PROVINCE_NAMES[state.province as ProvinceCode]} · Income type: {state.target.incomeType}
      </div>
    </div>
  )
}

export function TaxBreakdown() {
  const state = useCalculatorStore()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Tax Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current">
          <TabsList className="mb-4">
            <TabsTrigger value="best" className="text-xs">Best Case</TabsTrigger>
            <TabsTrigger value="current" className="text-xs">Current</TabsTrigger>
            <TabsTrigger value="worst" className="text-xs">Worst Case</TabsTrigger>
          </TabsList>
          {(["best", "current", "worst"] as const).map(id => (
            <TabsContent key={id} value={id}>
              <TaxCard returnRate={state.assumptions.scenarioReturns[id]} label={SCENARIO_DEFAULTS[id].label} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
