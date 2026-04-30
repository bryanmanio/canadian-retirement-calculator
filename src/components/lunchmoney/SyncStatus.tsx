"use client"

import { useCalculatorStore } from "@/store/calculatorStore"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function SyncStatus() {
  const { lmConnected, lmLastSynced, lmSyncing, lmSyncError, syncLunchMoney, applyLunchMoneyToBalances } = useCalculatorStore()

  if (!lmConnected) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground flex items-center gap-2">
        <WifiOff className="h-3 w-3" />
        Lunch Money not connected
      </div>
    )
  }

  const lastSyncedText = lmLastSynced
    ? formatDistanceToNow(new Date(lmLastSynced), { addSuffix: true })
    : "never"

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Wifi className="h-3 w-3 text-green-500" />
          <Badge variant="secondary" className="text-xs">Lunch Money</Badge>
          <span className="text-muted-foreground">Synced {lastSyncedText}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() => syncLunchMoney().then(() => applyLunchMoneyToBalances())}
          disabled={lmSyncing}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${lmSyncing ? "animate-spin" : ""}`} />
          {lmSyncing ? "Syncing..." : "Refresh"}
        </Button>
      </div>
      {lmSyncError && (
        <p className="text-xs text-red-500">{lmSyncError}</p>
      )}
    </div>
  )
}
