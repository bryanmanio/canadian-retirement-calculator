"use client"

import { useCalculatorStore } from "@/store/calculatorStore"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPercent } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function AssumptionSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = formatPercent,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="font-medium tabular-nums">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

export function AssumptionsPanel() {
  const state = useCalculatorStore()

  return (
    <Card>
      <CardHeader className="pb-0">
        <Accordion type="single" collapsible>
          <AccordionItem value="assumptions" className="border-none">
            <AccordionTrigger className="py-2">
              <CardTitle className="text-sm font-semibold">Assumptions &amp; Settings</CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="px-0 space-y-5 pt-2">
                {/* Inflation & rates */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Economic Assumptions
                  </div>
                  <AssumptionSlider
                    label="Inflation rate"
                    value={state.assumptions.inflationRate}
                    min={0.005} max={0.08} step={0.001}
                    onChange={v => state.setAssumptions({ inflationRate: v })}
                  />
                  <AssumptionSlider
                    label="OAS indexing rate"
                    value={state.assumptions.oasIndexingRate}
                    min={0.005} max={0.05} step={0.001}
                    onChange={v => state.setAssumptions({ oasIndexingRate: v })}
                  />
                  <AssumptionSlider
                    label="Safe withdrawal rate (SWR)"
                    value={state.assumptions.withdrawalRate}
                    min={0.02} max={0.07} step={0.001}
                    onChange={v => state.setAssumptions({ withdrawalRate: v })}
                  />
                </div>

                {/* Return rates */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Return Rates
                  </div>
                  <AssumptionSlider
                    label="Best case (XEQT benchmark)"
                    value={state.assumptions.scenarioReturns.best}
                    min={0.04} max={0.20} step={0.001}
                    onChange={v => state.setScenarioReturn("best", v)}
                  />
                  <AssumptionSlider
                    label="Current trajectory"
                    value={state.assumptions.scenarioReturns.current}
                    min={0.04} max={0.20} step={0.001}
                    onChange={v => state.setScenarioReturn("current", v)}
                  />
                  <AssumptionSlider
                    label="Worst case (conservative)"
                    value={state.assumptions.scenarioReturns.worst}
                    min={0.02} max={0.15} step={0.001}
                    onChange={v => state.setScenarioReturn("worst", v)}
                  />
                </div>

                {/* Monte Carlo settings */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Monte Carlo Settings
                  </div>
                  <AssumptionSlider
                    label="Return std deviation"
                    value={state.assumptions.stdDev}
                    min={0.04} max={0.30} step={0.01}
                    onChange={v => state.setAssumptions({ stdDev: v })}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Simulations</Label>
                    <Select
                      value={String(state.assumptions.monteCarloSimulations)}
                      onValueChange={v => state.setAssumptions({ monteCarloSimulations: parseInt(v) })}
                    >
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 (fast)</SelectItem>
                        <SelectItem value="500">500 (default)</SelectItem>
                        <SelectItem value="1000">1000 (accurate)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={state.resetDefaults}
                >
                  Reset all assumptions to defaults
                </Button>
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardHeader>
    </Card>
  )
}
