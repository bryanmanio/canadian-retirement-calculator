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

// Known corporate/business institution names — anything matching these
// is treated as a corporate account (investment or savings depending on type).
// Add your own corp's name here if you re-import frequently.
const KNOWN_CORP_NAMES = [
  "mediumrare",
  "medium rare",
]

// Common Canadian credit-card issuers + popular card networks.
// Used in addition to Lunch Money's type_name="credit" detection because
// some cards arrive with a generic type and only the brand in the name.
const CREDIT_CARD_KEYWORDS = [
  "credit card", "creditcard",
  "amex", "american express",
  "visa", "mastercard", "master card",
  "rogers world elite", "rogers mastercard",
  "pc financial mastercard", "pc mastercard",
  "costco mastercard",
  "tangerine money-back", "tangerine credit",
  "mbna", "capital one",
  "neo financial", "brim financial",
  "td cash back visa", "td aeroplan", "td first class", "td emerald",
  "rbc avion", "rbc cash back", "rbc westjet",
  "scotia momentum", "scotiabank gold", "scene visa",
  "bmo cashback", "bmo eclipse", "bmo air miles",
  "cibc dividend", "cibc aventura", "cibc costco",
  "wealthsimple cash", // WS Cash is a debit card, but easy to confuse — handle separately below
  "amazon visa", "marriott bonvoy", "aeroplan visa",
]

// Auto-suggest category based on account name + institution + type + subtype.
// Order matters — most specific patterns first. Uses word-boundary matching
// to avoid false positives (e.g. "rsp" inside "respond").
export function suggestCategory(account: LunchMoneyAccount): string | null {
  const haystack = [
    account.name,
    account.display_name ?? "",
    account.institution_name ?? "",
    account.type_name ?? "",
    account.subtype_name ?? "",
  ].join(" ").toLowerCase()

  // Word-boundary matcher — matches at start/end or surrounded by non-word chars
  const has = (...needles: string[]) =>
    needles.some(n => new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`, "i").test(haystack))

  // Substring matcher — for multi-word phrases
  const includes = (...needles: string[]) => needles.some(n => haystack.includes(n))

  const typeName = (account.type_name ?? "").toLowerCase()
  const subtype = (account.subtype_name ?? "").toLowerCase()

  // ── Credit cards / loans / liabilities — ignore early ─────────────────
  // Wealthsimple Cash is technically not a credit card; let it fall through
  // to checking/cash detection. Otherwise a card mention → ignore.
  if (typeName === "credit" || typeName === "credit card" || typeName === "loan" ||
      typeName === "other liability" || typeName === "mortgage") return "ignore"
  if (subtype.includes("credit card") || subtype === "credit") return "ignore"
  if (!includes("wealthsimple cash") && includes(...CREDIT_CARD_KEYWORDS)) return "ignore"

  // Real estate / vehicle / non-financial assets
  if (typeName === "real estate" || typeName === "vehicle" || typeName === "other asset") return "ignore"

  // ── Corporate detection (run early so corp + investment combo wins) ───
  const isCorpName = includes(...KNOWN_CORP_NAMES) ||
    has("corp", "inc", "ltd", "holdco", "opco") ||
    includes("corporate", "holding co", "operating co", "professional corp")

  if (isCorpName) {
    // If it looks like an investment / crypto / brokerage account → corp investment
    if (typeName === "investment" || typeName === "brokerage" || typeName === "cryptocurrency" ||
        subtype === "investment" || subtype === "brokerage" ||
        includes("crypto", "investment", "brokerage", "trading", "stock")) {
      return "corporateInvestment"
    }
    // Cash-like under a corp → corp savings
    if (typeName === "cash" || typeName === "depository" ||
        includes("savings", "chequing", "checking", "cash")) {
      return "corporateSavings"
    }
    // Default: corp investment
    return "corporateInvestment"
  }

  // ── Registered personal accounts ──────────────────────────────────────
  if (has("tfsa") || includes("tax-free", "tax free")) return "tfsa"
  if (has("fhsa") || includes("first home savings", "first-home")) return "fhsa"
  if (has("rdsp") || includes("disability savings")) return "rdsp"
  if (has("lira", "lif", "lrif", "lrsp") || includes("locked-in", "locked in")) return "lira"
  if (has("rrsp", "rsp", "rrif") || includes("retirement savings", "registered retirement")) return "rrsp"
  if (has("resp") || includes("education savings")) return "ignore" // not retirement-relevant

  // ── Cash / chequing ──────────────────────────────────────────────────
  if (includes("chequing", "checking", "everyday", "no fee account",
      "high interest savings", "hisa", "esavings", "e-savings", "wealthsimple cash")) return "cash"

  // ── Non-registered investment / brokerage ────────────────────────────
  if (includes("margin", "non-registered", "non registered", "non-reg",
      "individual cash", "joint cash", "personal investment", "brokerage", "trading account")) return "nonRegistered"

  // Generic savings (after HISA checks above) → cash by default
  if (includes("savings")) return "cash"

  // ── Fall back to type_name from Lunch Money ──────────────────────────
  if (typeName === "cash" || typeName === "depository") return "cash"
  if (typeName === "investment" || typeName === "brokerage" || typeName === "cryptocurrency") return "nonRegistered"
  if (typeName === "employee compensation") return "nonRegistered"

  // Subtype fallback
  if (subtype === "investment" || subtype === "brokerage" || subtype === "crypto") return "nonRegistered"
  if (subtype === "cash" || subtype === "checking" || subtype === "savings") return "cash"

  return null
}
