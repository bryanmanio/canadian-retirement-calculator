"use client"

import { useMemo } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { calculateIncomeTax, grossUpForTax, calculateOASAnnual, calculateCPPAnnual } from "@/lib/tax"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { PROVINCE_NAMES } from "@/lib/constants"
import type { ProvinceCode } from "@/types"

function TaxRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${highlight ? "font-semibold border-t pt-1 mt-1" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function TaxCard() {
  const state = useCalculatorStore()

  const calc = useMemo(() => {
    const oasAnnual = state.benefits.includeOAS
      ? calculateOASAnnual(state.benefits.oasStartAge, 0, 0)
      : 0

    const cppAnnual = state.benefits.includeCPP
      ? calculateCPPAnnual(state.benefits.estimatedMonthlyCPP, state.benefits.cppStartAge)
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
  }, [state])

  const provinceName = PROVINCE_NAMES[state.province as ProvinceCode]

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
          <TaxRow label={`Provincial tax (${state.province})`} value={formatCurrency(calc.pre65Tax.provincialTax)} />
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
        Province: {provinceName} · Income type: {state.target.incomeType}
      </div>
    </div>
  )
}

export function TaxBreakdown() {
  return (
    <Card>
      <Accordion type="single" collapsible>
        <AccordionItem value="tax" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="text-sm font-semibold">Tax Breakdown</span>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="pt-0">
              <TaxCard />
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
