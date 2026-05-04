"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useCalculatorStore } from "@/store/calculatorStore"
import { RetirementDashboard } from "@/components/calculator/RetirementDashboard"
import { InputsPanel } from "@/components/calculator/InputsPanel"
import { ScenarioCards } from "@/components/calculator/ScenarioCards"
import { ProjectionsChart } from "@/components/calculator/ProjectionsChart"
import { WithdrawalBreakdown } from "@/components/calculator/WithdrawalBreakdown"
import { TaxBreakdown } from "@/components/calculator/TaxBreakdown"
import { AssumptionsPanel } from "@/components/calculator/AssumptionsPanel"
import { MonteCarloChart } from "@/components/calculator/MonteCarloChart"
import { ExportBar } from "@/components/calculator/ExportBar"
import { Button } from "@/components/ui/button"
import { Plus, Pencil } from "lucide-react"
import Link from "next/link"

function PageInner() {
  const { loadFromURL, lmConnected } = useCalculatorStore()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams && searchParams.toString()) {
      loadFromURL(searchParams)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm no-print sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-medium tracking-tight">
              <span className="mr-1.5">🇨🇦</span>
              Canadian Retirement Calculator
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground tracking-wide">
              Private · runs entirely in your browser
            </p>
          </div>
          <Button
            size="sm"
            asChild
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm rounded-full px-4"
          >
            <Link href="/settings">
              {lmConnected ? (
                <><Pencil className="h-4 w-4 mr-1.5" />Edit accounts</>
              ) : (
                <><Plus className="h-4 w-4 mr-1.5" />Add/Import accounts</>
              )}
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 sm:px-8 py-10 sm:py-14 space-y-10 sm:space-y-12">
        {/* Dashboard */}
        <RetirementDashboard />

        {/* Main layout: sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 lg:gap-10">
          {/* Left sidebar: inputs */}
          <aside className="space-y-5 no-print lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            <InputsPanel />
          </aside>

          {/* Right: charts and analysis */}
          <div className="space-y-10 sm:space-y-12 min-w-0">
            <ScenarioCards />
            <ProjectionsChart />
            <MonteCarloChart />
            <WithdrawalBreakdown />
            <TaxBreakdown />
            <AssumptionsPanel />
          </div>
        </div>

        {/* Export bar */}
        <ExportBar />
      </main>

      <footer className="border-t border-border/60 mt-16 py-10 text-center text-[11px] text-muted-foreground tracking-wide no-print">
        <p className="max-w-md mx-auto">For informational purposes only. Not financial advice. Consult a licensed financial advisor for personalized guidance.</p>
        <p className="mt-2 opacity-70">2025 tax brackets · OAS &amp; CPP rates current as of Q1 2025</p>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <PageInner />
    </Suspense>
  )
}
