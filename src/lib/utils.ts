import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toLocaleString("en-CA", { maximumFractionDigits: 2 })}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `$${(value / 1_000).toLocaleString("en-CA", { maximumFractionDigits: 1 })}K`
    }
  }
  return value.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatAge(age: number): string {
  return `Age ${age}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function getStatusColor(ratio: number): string {
  if (ratio >= 1.0) return "text-green-600 dark:text-green-400"
  if (ratio >= 0.75) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

export function getStatusBg(ratio: number): string {
  if (ratio >= 1.0) return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
  if (ratio >= 0.75) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
  return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
}
