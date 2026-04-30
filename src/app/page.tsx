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
import { Settings } from "lucide-react"
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
      <header className="border-b bg-card no-print">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">🇨🇦 Canadian Retirement Calculator</h1>
            <p className="text-xs text-muted-foreground">All calculations are private and run in your browser</p>
          </div>
          <div className="flex items-center gap-2">
            {lmConnected && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                Lunch Money connected
              </span>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings"><Settings className="h-4 w-4 mr-1" />Settings</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard */}
        <RetirementDashboard />

        {/* Main layout: sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left sidebar: inputs */}
          <aside className="space-y-4 no-print">
            <InputsPanel />
          </aside>

          {/* Right: charts and analysis */}
          <div className="space-y-6 min-w-0">
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

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground no-print">
        <p>For informational purposes only. Not financial advice. Consult a licensed financial advisor for personalized guidance.</p>
        <p className="mt-1">2025 tax brackets · OAS &amp; CPP rates current as of Q1 2025</p>
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
