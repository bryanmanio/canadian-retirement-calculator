import type { LunchMoneyAccount } from "@/types"

const LM_BASE = "https://dev.lunchmoney.app/v1"
const LM_KEY = "lm_api_key"

export function saveLunchMoneyKey(key: string): void {
  if (typeof window !== "undefined") localStorage.setItem(LM_KEY, key)
}

export function getLunchMoneyKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(LM_KEY)
}

export function clearLunchMoneyKey(): void {
  if (typeof window !== "undefined") localStorage.removeItem(LM_KEY)
}

async function lmFetch<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${LM_BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Lunch Money API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function validateLunchMoneyKey(key: string): Promise<boolean> {
  try {
    await lmFetch("/me", key)
    return true
  } catch {
    return false
  }
}

export async function fetchLunchMoneyAccounts(key: string): Promise<LunchMoneyAccount[]> {
  const [assetsRes, plaidRes] = await Promise.allSettled([
    lmFetch<{ assets: LunchMoneyAccount[] }>("/assets", key),
    lmFetch<{ plaid_accounts: LunchMoneyAccount[] }>("/plaid_accounts", key),
  ])

  const assets =
    assetsRes.status === "fulfilled" ? (assetsRes.value.assets ?? []) : []
  const plaid =
    plaidRes.status === "fulfilled" ? (plaidRes.value.plaid_accounts ?? []) : []

  return [...assets, ...plaid]
}

// Auto-suggest category based on account name + institution + type keywords.
// Order matters — most specific patterns first. Uses word-boundary matching
// to avoid false positives (e.g. "rsp" inside "respond").
export function suggestCategory(account: LunchMoneyAccount): string | null {
  const haystack = [
    account.name,
    account.display_name ?? "",
    account.institution_name ?? "",
    account.type_name ?? "",
  ].join(" ").toLowerCase()

  // Word-boundary matcher — matches at start/end or surrounded by non-word chars
  const has = (...needles: string[]) =>
    needles.some(n => new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`, "i").test(haystack))

  // Substring matcher — for multi-word phrases
  const includes = (...needles: string[]) => needles.some(n => haystack.includes(n))

  // Registered accounts — most specific first
  if (has("tfsa") || includes("tax-free", "tax free")) return "tfsa"
  if (has("fhsa") || includes("first home savings", "first-home")) return "fhsa"
  if (has("rdsp") || includes("disability savings")) return "rdsp"
  if (has("lira", "lif", "lrif", "lrsp") || includes("locked-in", "locked in")) return "lira"
  if (has("rrsp", "rsp", "rrif") || includes("retirement savings", "registered retirement")) return "rrsp"
  if (has("resp") || includes("education savings")) return "ignore" // RESP not retirement-relevant

  // Corporate
  if (has("corp", "inc", "ltd", "holdco", "opco") || includes("corporate", "holding co", "operating co", "business")) {
    if (includes("savings", "chequing", "checking", "cash")) return "corporateSavings"
    return "corporateInvestment"
  }

  // Cash / chequing — check before generic "savings" since HISA names often include "savings"
  if (includes("chequing", "checking", "everyday", "no fee account", "high interest savings", "hisa", "esavings", "e-savings")) return "cash"

  // Non-registered investment / brokerage
  if (includes("margin", "non-registered", "non registered", "non-reg", "individual cash", "joint cash", "personal investment", "brokerage", "trading account")) return "nonRegistered"

  // Generic savings (after HISA checks above) → cash by default
  if (includes("savings")) return "cash"

  // Fall back to type_name from Lunch Money
  const typeName = (account.type_name ?? "").toLowerCase()
  if (typeName === "credit" || typeName === "loan" || typeName === "credit card") return "ignore"
  if (typeName === "cash" || typeName === "depository") return "cash"
  if (typeName === "investment" || typeName === "brokerage") return "nonRegistered"
  if (typeName === "real estate" || typeName === "vehicle" || typeName === "other liability") return "ignore"

  return null
}
