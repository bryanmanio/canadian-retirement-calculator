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

// Auto-suggest category based on account name keywords
export function suggestCategory(account: LunchMoneyAccount): string | null {
  const name = (account.name + " " + (account.institution_name ?? "") + " " + (account.type_name ?? "")).toLowerCase()

  if (name.includes("tfsa")) return "tfsa"
  if (name.includes("rrsp") || name.includes("rrif")) return "rrsp"
  if (name.includes("lira") || name.includes("locked")) return "lira"
  if (name.includes("fhsa")) return "fhsa"
  if (name.includes("rdsp")) return "rdsp"
  if (name.includes("corporate") || name.includes("corp") || name.includes("business")) return "corporateInvestment"
  if (name.includes("chequing") || name.includes("checking") || name.includes("savings") || name.includes("cash")) return "cash"
  if (name.includes("investment") || name.includes("brokerage") || name.includes("non-reg")) return "nonRegistered"

  const typeName = (account.type_name ?? "").toLowerCase()
  if (typeName === "credit") return "ignore"
  if (typeName === "cash" || typeName === "depository") return "cash"
  if (typeName === "investment" || typeName === "brokerage") return "nonRegistered"

  return null
}
