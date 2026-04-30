"use client"

import { useState } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { PROVINCE_NAMES, OAS_ANNUAL_BY_START_AGE } from "@/lib/constants"
import type { ProvinceCode } from "@/types"
import { SyncStatus } from "@/components/lunchmoney/SyncStatus"

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        {editing ? (
          <Input
            className="h-6 w-28 text-right text-sm px-1"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={() => {
              const n = parseFloat(draft.replace(/[^0-9.]/g, ""))
              if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
              setEditing(false)
            }}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === "Escape") {
                const n = parseFloat(draft.replace(/[^0-9.]/g, ""))
                if (!isNaN(n) && e.key === "Enter") onChange(Math.max(min, Math.min(max, n)))
                setEditing(false)
              }
            }}
          />
        ) : (
          <button
            className="text-sm font-medium tabular-nums hover:text-primary transition-colors cursor-pointer"
            onClick={() => { setDraft(String(value)); setEditing(true) }}
          >
            {format(value)}
          </button>
        )}
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  )
}

const provinces = Object.entries(PROVINCE_NAMES) as [ProvinceCode, string][]

export function InputsPanel() {
  const state = useCalculatorStore()

  const oasAnnual = OAS_ANNUAL_BY_START_AGE[state.benefits.oasStartAge] ?? 0

  return (
    <div className="space-y-3">
      {/* Lunch Money sync status */}
      {state.lmConnected && <SyncStatus />}

      {!state.lmConnected && (
        <div className="rounded-md border border-dashed border-muted-foreground/30 p-3 text-xs text-muted-foreground text-center">
          Manual mode — <a href="/settings" className="underline hover:text-foreground">connect Lunch Money</a> to auto-fill balances
        </div>
      )}

      <Accordion type="multiple" defaultValue={["personal", "portfolio", "contributions", "target", "benefits"]}>
        {/* Personal Info */}
        <AccordionItem value="personal">
          <AccordionTrigger className="text-sm font-semibold">Personal Info</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <SliderField
              label="Current age"
              value={state.currentAge}
              min={18} max={75} step={1}
              format={v => `${v} years old`}
              onChange={v => state.setAge(v)}
            />
            <SliderField
              label="Target retirement age"
              value={state.targetRetirementAge}
              min={45} max={75} step={1}
              format={v => `Age ${v}`}
              onChange={v => state.setRetirementAge(v)}
            />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Province</Label>
              <Select value={state.province} onValueChange={v => state.setProvince(v as ProvinceCode)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Filing status</Label>
              <div className="flex items-center gap-2 text-xs">
                <span className={state.filingStatus === "single" ? "font-medium" : "text-muted-foreground"}>Single</span>
                <Switch
                  checked={state.filingStatus === "married"}
                  onCheckedChange={v => state.setFilingStatus(v ? "married" : "single")}
                />
                <span className={state.filingStatus === "married" ? "font-medium" : "text-muted-foreground"}>Married</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Portfolio Balances */}
        <AccordionItem value="portfolio">
          <AccordionTrigger className="text-sm font-semibold">Portfolio Balances</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <SliderField label="TFSA" value={state.balances.tfsa} min={0} max={500_000} step={1_000}
              format={formatCurrency} onChange={v => state.setBalances({ tfsa: v })} />
            <SliderField label="RRSP / RRIF" value={state.balances.rrsp} min={0} max={2_000_000} step={5_000}
              format={formatCurrency} onChange={v => state.setBalances({ rrsp: v })} />
            <SliderField label="Non-registered" value={state.balances.nonRegistered} min={0} max={2_000_000} step={5_000}
              format={formatCurrency} onChange={v => state.setBalances({ nonRegistered: v })} />
            <SliderField label="Corporate investment" value={state.balances.corporateInvestment} min={0} max={5_000_000} step={10_000}
              format={formatCurrency} onChange={v => state.setBalances({ corporateInvestment: v })} />
            <SliderField label="Other savings" value={state.balances.otherSavings} min={0} max={500_000} step={1_000}
              format={formatCurrency} onChange={v => state.setBalances({ otherSavings: v })} />
          </AccordionContent>
        </AccordionItem>

        {/* Contributions */}
        <AccordionItem value="contributions">
          <AccordionTrigger className="text-sm font-semibold">Annual Contributions</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <SliderField label="TFSA (annual)" value={state.contributions.tfsa} min={0} max={100_000} step={500}
              format={formatCurrency} onChange={v => state.setContributions({ tfsa: v })} />
            <SliderField label="RRSP (annual)" value={state.contributions.rrsp} min={0} max={100_000} step={500}
              format={formatCurrency} onChange={v => state.setContributions({ rrsp: v })} />
            <SliderField label="Non-registered (annual)" value={state.contributions.nonRegistered} min={0} max={100_000} step={1_000}
              format={formatCurrency} onChange={v => state.setContributions({ nonRegistered: v })} />
            <SliderField label="Corporate (annual)" value={state.contributions.corporate} min={0} max={500_000} step={5_000}
              format={formatCurrency} onChange={v => state.setContributions({ corporate: v })} />
          </AccordionContent>
        </AccordionItem>

        {/* Retirement Income Target */}
        <AccordionItem value="target">
          <AccordionTrigger className="text-sm font-semibold">Retirement Income Target</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <SliderField label="Target net annual income" value={state.target.annualIncome} min={30_000} max={500_000} step={5_000}
              format={formatCurrency} onChange={v => state.setTarget({ annualIncome: v })} />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Income source</Label>
              <Select value={state.target.incomeType} onValueChange={v => state.setTarget({ incomeType: v as "salary" | "dividends" | "mixed" })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary / employment income</SelectItem>
                  <SelectItem value="dividends">Eligible dividends (corp)</SelectItem>
                  <SelectItem value="mixed">Mixed (50/50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Withdrawal structure</Label>
              <Select value={state.target.withdrawalStructure} onValueChange={v => state.setTarget({ withdrawalStructure: v as "personal-first" | "corporate-first" | "blended" })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal-first">Personal accounts first</SelectItem>
                  <SelectItem value="corporate-first">Corporate first</SelectItem>
                  <SelectItem value="blended">Blended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Government Benefits */}
        <AccordionItem value="benefits">
          <AccordionTrigger className="text-sm font-semibold">Government Benefits</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {/* OAS */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Old Age Security (OAS)</span>
              <Switch checked={state.benefits.includeOAS} onCheckedChange={v => state.setBenefits({ includeOAS: v })} />
            </div>
            {state.benefits.includeOAS && (
              <div className="pl-3 border-l-2 border-muted space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">OAS start age</Label>
                  <Select
                    value={String(state.benefits.oasStartAge)}
                    onValueChange={v => state.setBenefits({ oasStartAge: parseInt(v) as GovernmentBenefitsOASAge })}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[65, 66, 67, 68, 69, 70].map(age => (
                        <SelectItem key={age} value={String(age)}>
                          Age {age} — {formatCurrency(OAS_ANNUAL_BY_START_AGE[age])}/yr
                          {age > 65 && ` (+${((age - 65) * 7.2).toFixed(1)}%)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual OAS: <strong>{formatCurrency(oasAnnual)}</strong> (indexed {state.assumptions.oasIndexingRate * 100}%/yr)
                </p>
              </div>
            )}

            {/* CPP */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Canada Pension Plan (CPP)</span>
              <Switch checked={state.benefits.includeCPP} onCheckedChange={v => state.setBenefits({ includeCPP: v })} />
            </div>
            {state.benefits.includeCPP && (
              <div className="pl-3 border-l-2 border-muted space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">CPP start age</Label>
                  <Select value={String(state.benefits.cppStartAge)} onValueChange={v => state.setBenefits({ cppStartAge: parseInt(v) as 60 | 65 | 70 })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">Age 60 (−36% penalty)</SelectItem>
                      <SelectItem value="65">Age 65 (standard)</SelectItem>
                      <SelectItem value="70">Age 70 (+42% enhancement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <SliderField
                  label="Estimated monthly CPP at age 65"
                  value={state.benefits.estimatedMonthlyCPP}
                  min={0} max={1_400} step={25}
                  format={v => `${formatCurrency(v)}/mo`}
                  onChange={v => state.setBenefits({ estimatedMonthlyCPP: v })}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

type GovernmentBenefitsOASAge = 65 | 66 | 67 | 68 | 69 | 70
