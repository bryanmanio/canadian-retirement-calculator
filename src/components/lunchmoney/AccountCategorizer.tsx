"use client"

import { useCalculatorStore } from "@/store/calculatorStore"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ACCOUNT_CATEGORY_LABELS } from "@/lib/constants"
import type { AccountCategory } from "@/types"
import { toast } from "sonner"

const CATEGORIES = Object.entries(ACCOUNT_CATEGORY_LABELS) as [AccountCategory, string][]

function formatBalance(balance: string, currency: string): string {
  const n = parseFloat(balance)
  if (isNaN(n)) return balance
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: currency.toUpperCase() === "CAD" ? "CAD" : "USD",
    maximumFractionDigits: 0,
  })
}

export function AccountCategorizer() {
  const { lmAccounts, lmAccountCategories, setAccountCategory, applyLunchMoneyToBalances } = useCalculatorStore()

  if (lmAccounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
        No accounts found. Connect to Lunch Money first.
      </div>
    )
  }

  function handleApply() {
    applyLunchMoneyToBalances()
    toast.success("Balances applied to calculator!")
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lmAccounts.map(acc => {
              const id = String(acc.id)
              const category = lmAccountCategories[id]
              return (
                <TableRow key={id}>
                  <TableCell>
                    <div className="font-medium text-sm">{acc.name}</div>
                    {acc.institution_name && (
                      <div className="text-xs text-muted-foreground">{acc.institution_name}</div>
                    )}
                    {acc.type_name && (
                      <Badge variant="outline" className="text-xs mt-0.5">{acc.type_name}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium text-sm">
                    {formatBalance(acc.balance, acc.currency)}
                    {acc.currency?.toUpperCase() !== "CAD" && (
                      <div className="text-xs text-muted-foreground">{acc.currency}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={category ?? ""}
                      onValueChange={v => setAccountCategory(id, v as AccountCategory)}
                    >
                      <SelectTrigger className="h-7 text-xs w-48">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Button onClick={handleApply} className="w-full">
        Apply to Calculator
      </Button>

      <p className="text-xs text-muted-foreground">
        Accounts categorized as &quot;Cash / Chequing&quot; or &quot;Ignore&quot; are excluded from retirement calculations.
        Categorizations are saved to your browser.
      </p>
    </div>
  )
}
