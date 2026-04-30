"use client"

import { useCalculatorStore } from "@/store/calculatorStore"
import { computeAllScenarios } from "@/lib/retirement"
import { buildProjectionCSV } from "@/lib/retirement"
import { Button } from "@/components/ui/button"
import { Download, Link, Printer } from "lucide-react"
import { toast } from "sonner"
import { downloadCSV } from "@/lib/utils"

export function ExportBar() {
  const state = useCalculatorStore()

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

  function handlePDF() {
    window.print()
  }

  function handleShare() {
    const qs = state.serializeToURL()
    const url = `${window.location.origin}${window.location.pathname}?${qs}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Shareable link copied to clipboard!")
    }).catch(() => {
      toast.error("Could not copy link. Copy from the address bar.")
    })
  }

  function handleCSV() {
    const scenarios = computeAllScenarios(params)
    const content = [
      buildProjectionCSV(scenarios.best, "Best Case (XEQT)"),
      "\n\n",
      buildProjectionCSV(scenarios.current, "Current Trajectory"),
      "\n\n",
      buildProjectionCSV(scenarios.worst, "Worst Case (Conservative)"),
    ].join("")
    downloadCSV("retirement-projections.csv", content)
    toast.success("CSV downloaded!")
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-t no-print">
      <span className="text-sm text-muted-foreground">Export:</span>
      <Button variant="outline" size="sm" onClick={handlePDF}>
        <Printer className="h-4 w-4 mr-1" />
        Print / PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleCSV}>
        <Download className="h-4 w-4 mr-1" />
        Download CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Link className="h-4 w-4 mr-1" />
        Copy shareable link
      </Button>
    </div>
  )
}
