"use client";

// Ported verbatim from the Base44 app's src/components/CurrencySelector.jsx.
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useCurrency } from "@/lib/useCurrency";
import { SELECTABLE_COUNTRIES, CURRENCIES } from "@/lib/pricingConfig";

export default function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setOverride } = useCurrency();

  const activeCountry = SELECTABLE_COUNTRIES.find((c) => c.currency === currency) ?? SELECTABLE_COUNTRIES[0];

  const handleChange = (countryCode: string) => {
    const choice = SELECTABLE_COUNTRIES.find((c) => c.code === countryCode);
    if (choice) setOverride(choice.currency);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      <Select value={activeCountry.code} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px] min-h-[44px] gap-2" aria-label="Select your country or currency">
          <span className="text-base leading-none">{activeCountry.flag}</span>
          <SelectValue placeholder="Select country" />
        </SelectTrigger>
        <SelectContent>
          {SELECTABLE_COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="min-h-[44px]">
              <span className="flex items-center gap-2">
                <span className="text-base">{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-muted-foreground text-xs">({CURRENCIES[c.currency].code})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
