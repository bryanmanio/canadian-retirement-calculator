"use client"

import { useState } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, Wifi, WifiOff } from "lucide-react"

export function ApiConnect() {
  const { lmConnected, lmSyncing, lmSyncError, connectLunchMoney, disconnectLunchMoney } = useCalculatorStore()
  const [key, setKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  async function handleConnect() {
    if (!key.trim()) return
    await connectLunchMoney(key.trim())
    setKey("")
  }

  if (lmConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-500" />
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
            Connected to Lunch Money
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your API key is stored only in your browser&apos;s localStorage and never transmitted to any server other than Lunch Money.
        </p>
        <Button variant="destructive" size="sm" onClick={disconnectLunchMoney}>
          <WifiOff className="h-4 w-4 mr-1" />
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lm-key">Lunch Money API Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="lm-key"
              type={showKey ? "text" : "password"}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Paste your API key here"
              className="pr-10"
              onKeyDown={e => e.key === "Enter" && handleConnect()}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={handleConnect} disabled={lmSyncing || !key.trim()}>
            {lmSyncing ? "Connecting..." : "Connect"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Get your API key from <strong>Lunch Money → Settings → Developers</strong>.
          Your key is stored only in your browser localStorage — never sent to this server.
        </p>
      </div>

      {lmSyncError && (
        <Alert variant="destructive">
          <AlertDescription>{lmSyncError}</AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertDescription className="text-xs">
          <strong>Privacy:</strong> This app is entirely client-side. Your Lunch Money API key is used to fetch your
          account balances directly from Lunch Money&apos;s servers in your browser. It is never logged, stored on any
          server, or transmitted to anyone other than Lunch Money.
        </AlertDescription>
      </Alert>
    </div>
  )
}
