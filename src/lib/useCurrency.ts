"use client";

// Ported from the Base44 app's src/lib/useCurrency.js. Order of truth:
// manual override (currency selector) > geo-IP > default.
//
// Simplified from the original: it also read a "registered market" off the
// logged-in user's own record so a South African musician always saw ZAR
// regardless of where they browsed from. Musician has no such `market`
// field yet — there was nothing to port there without inventing a column
// the schema doesn't have. Re-add that precedence level (ahead of geo-IP,
// same as the original) once/if that field exists.
//
// Also adapted for SSR, which the original never had to deal with (Base44
// was a pure client-side SPA): the original read localStorage straight in
// the useState initializer so repeat visitors skipped a flash of the
// default currency. That initializer runs during SSR too, where
// localStorage doesn't exist, so the server-rendered HTML and the client's
// first hydration pass disagreed — confirmed as a real "Hydration failed"
// console error while testing, not a hypothetical. Starting from a fixed
// DEFAULT_CURRENCY on every render and letting the effect below correct it
// post-mount reintroduces a brief flash for repeat visitors, but a
// consistently correct render beats a fast wrong one.
import { useCallback, useEffect, useState } from "react";
import { resolveCurrency, CURRENCIES, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/pricingConfig";

const OVERRIDE_KEY = "enkore_override";
const GEO_KEY = "enkore_geo";
const CURRENCY_KEY = "enkore_currency";

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);
  const [ready, setReady] = useState(false);

  const recompute = useCallback(async (override: string | null) => {
    let geoCountry = readCachedGeo();
    if (!override && !geoCountry) {
      geoCountry = await lookupCountry();
      if (geoCountry) {
        localStorage.setItem(GEO_KEY, JSON.stringify({ country: geoCountry, at: Date.now() }));
      }
    }

    const resolved = resolveCurrency({ override, geoCountry });
    localStorage.setItem(CURRENCY_KEY, resolved);
    setCurrency(resolved);
    return resolved;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const override = readOverride();
      const resolved = await recompute(override);
      if (!cancelled) {
        setCurrency(resolved);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recompute]);

  const setOverride = useCallback(
    (nextCurrency: string) => {
      const code = (nextCurrency || "").toUpperCase();
      if (code in CURRENCIES) {
        localStorage.setItem(OVERRIDE_KEY, code);
        localStorage.setItem(CURRENCY_KEY, code);
        setCurrency(code as CurrencyCode);
      } else {
        localStorage.removeItem(OVERRIDE_KEY);
        recompute(null);
      }
    },
    [recompute],
  );

  const clearOverride = useCallback(() => {
    localStorage.removeItem(OVERRIDE_KEY);
    recompute(null);
  }, [recompute]);

  return { currency, ready, setOverride, clearOverride };
}

function readOverride(): string | null {
  const v = (safeGet(OVERRIDE_KEY) || "").toUpperCase();
  return v in CURRENCIES ? v : null;
}

function readCachedGeo(): string | null {
  try {
    const c = (JSON.parse(safeGet(GEO_KEY) || "null")?.country || "").toUpperCase();
    return /^[A-Z]{2}$/.test(c) ? c : null;
  } catch {
    return null;
  }
}

async function lookupCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return null;
    const data = await res.json();
    const c = (data?.country_code || "").toUpperCase();
    return /^[A-Z]{2}$/.test(c) ? c : null;
  } catch {
    return null; // fail open to USD
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
