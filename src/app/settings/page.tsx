"use client"

import { ApiConnect } from "@/components/lunchmoney/ApiConnect"
import { AccountCategorizer } from "@/components/lunchmoney/AccountCategorizer"
import { SyncStatus } from "@/components/lunchmoney/SyncStatus"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
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
