"use client"

import { ApiConnect } from "@/components/lunchmoney/ApiConnect"
import { AccountCategorizer } from "@/components/lunchmoney/AccountCategorizer"
import { SyncStatus } from "@/components/lunchmoney/SyncStatus"
import { useCalculatorStore } from "@/store/calculatorStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const LUNCH_MONEY_AFFILIATE = "https://lunchmoney.app?fp_ref=jkfl23s&fp_sid=calc"

function LunchMoneyPromo() {
  return (
    <Card className="overflow-hidden border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-2">
          <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
              Recommended
            </div>
            <h2 className="text-lg font-bold leading-tight">
              Import your accounts with Lunch Money — my favorite budgeting app
            </h2>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          I personally use <strong className="text-foreground">Lunch Money</strong> to track every account, every transaction, and my full net worth in one place. It&apos;s built by an indie developer (not a faceless fintech), respects your privacy with read-only Plaid connections, supports Canadian banks, and has the cleanest interface I&apos;ve found. Connect it here and your TFSA, RRSP, and corporate balances import automatically — no more typing numbers from a dozen tabs.
        </p>

        <ul className="text-sm text-muted-foreground space-y-1.5 pl-1">
          <li className="flex gap-2"><span className="text-green-600 dark:text-green-400">✓</span> Auto-sync balances across banks, brokerages, and crypto</li>
          <li className="flex gap-2"><span className="text-green-600 dark:text-green-400">✓</span> Built-in budgeting, recurring detection, and net-worth tracking</li>
          <li className="flex gap-2"><span className="text-green-600 dark:text-green-400">✓</span> Read-only API key — your data never leaves your browser here</li>
          <li className="flex gap-2"><span className="text-green-600 dark:text-green-400">✓</span> No ads, no data selling, no enterprise bloat</li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
          >
            <a href={LUNCH_MONEY_AFFILIATE} target="_blank" rel="noopener noreferrer">
              Try Lunch Money free
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground self-center">
            14-day free trial · referral link supports this calculator
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const lmConnected = useCalculatorStore(s => s.lmConnected)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/"><ArrowLeft className="h-4 w-4 mr-1" />Back to Calculator</Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Promo block — only shown to users not yet connected */}
        {!lmConnected && <LunchMoneyPromo />}

        {/* Lunch Money Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Lunch Money Integration</CardTitle>
            <CardDescription>
              Connect your Lunch Money account to automatically import account balances into the calculator.
              Your API key never leaves your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiConnect />
            <SyncStatus />
          </CardContent>
        </Card>

        {/* Account Categorizer */}
        <Card>
          <CardHeader>
            <CardTitle>Account Categorization</CardTitle>
            <CardDescription>
              Map each Lunch Money account to a retirement account type. Balances are summed by type and applied to the calculator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountCategorizer />
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About This Calculator</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This calculator is designed for Canadians planning retirement. It uses 2025 federal and provincial tax brackets,
              current OAS and CPP rates, and standard financial planning formulas.
            </p>
            <p>
              <strong>Privacy:</strong> All data is stored locally in your browser. Nothing is sent to any server
              (except your Lunch Money API calls which go directly to Lunch Money).
            </p>
            <p>
              <strong>Disclaimer:</strong> This tool is for informational purposes only and does not constitute financial advice.
              Please consult a licensed financial advisor for personalized guidance.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
