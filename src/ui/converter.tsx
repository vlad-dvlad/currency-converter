"use client";

import { useId, useState } from "react";
import { parseAmount } from "@/domain/amount";
import { convert } from "@/domain/conversion";
import {
  DEFAULT_PAIR,
  SUPPORTED_CURRENCIES,
  chooseCurrency,
  swapPair,
  type Currency,
  type CurrencyPair,
  type PairField,
} from "@/domain/currency";
import { formatRate, formatRateDate, formatResult } from "@/domain/format";
import { messages } from "./messages";
import { useRate, type RateState } from "./use-rate";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const CONTROL = `h-12 w-full rounded-xl border border-border bg-surface px-4 text-text transition-colors hover:border-border-strong focus-visible:border-accent ${FOCUS_RING}`;

const LABEL = "text-sm font-medium text-muted";

export function Converter() {
  const [amountText, setAmountText] = useState("");
  const [pair, setPair] = useState<CurrencyPair>(DEFAULT_PAIR);
  const amountId = useId();
  const amountMessageId = useId();
  const rate = useRate(pair);

  // Derived on each render and never stored, so typing can never cause a rate request.
  const amount = parseAmount(amountText);
  const rejected = amount.kind === "rejected";
  const result =
    amount.kind === "valid" && rate.status === "ready"
      ? formatResult(convert(amount.value, rate.rate.rate), rate.rate.quote)
      : null;

  const choose = (field: PairField) => (currency: Currency) =>
    setPair((current) => chooseCurrency(current, field, currency));

  return (
    <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{messages.heading}</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor={amountId} className={LABEL}>
          {messages.amountLabel}
        </label>
        <input
          id={amountId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amountText}
          aria-invalid={rejected}
          aria-describedby={rejected ? amountMessageId : undefined}
          onChange={(event) => setAmountText(event.target.value)}
          className={`${CONTROL} h-14 text-right text-xl tabular-nums aria-invalid:border-danger aria-invalid:focus-visible:outline-danger`}
        />
        {rejected && (
          <p id={amountMessageId} className="text-sm text-danger">
            {messages.amountRejected}
          </p>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <CurrencyField label={messages.baseLabel} value={pair.base} onChoose={choose("base")} />
        <button
          type="button"
          aria-label={messages.swap}
          onClick={() => setPair(swapPair)}
          className={`group flex size-12 items-center justify-center rounded-full border border-border bg-accent-soft text-accent transition-colors hover:border-accent ${FOCUS_RING}`}
        >
          <SwapIcon />
        </button>
        <CurrencyField label={messages.quoteLabel} value={pair.quote} onChoose={choose("quote")} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <div role="status" className="flex flex-col gap-1">
          {result !== null && (
            // Sized to the viewport so the longest result (21 digits and separators) fits on one line.
            <p className="text-[clamp(1.25rem,6vw,1.875rem)] font-semibold tracking-tight tabular-nums break-words">
              {result}
            </p>
          )}
          <RateLine state={rate} />
        </div>
        {result !== null && <p className="text-xs text-muted">{messages.referenceLabel}</p>}
      </div>
    </div>
  );
}

function RateLine({ state }: { state: RateState }) {
  if (state.status === "pending") return <p className="text-muted">{messages.ratePending}</p>;
  if (state.status === "unavailable")
    return (
      <p className="flex items-center gap-2 text-sm text-danger">
        <WarningIcon />
        {messages.rateUnavailable}
      </p>
    );
  return (
    <>
      <p className="text-sm text-text tabular-nums">{formatRate(state.rate)}</p>
      <p className="text-sm text-muted">{formatRateDate(state.rate.date)}</p>
    </>
  );
}

function CurrencyField({
  label,
  value,
  onChoose,
}: {
  label: string;
  value: Currency;
  onChoose: (currency: Currency) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChoose(event.target.value as Currency)}
          className={`${CONTROL} cursor-pointer appearance-none pr-10 font-semibold`}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}

function SwapIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 transition-transform duration-300 motion-safe:group-hover:rotate-180"
    >
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h14" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H7" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M8.49 2.86c.67-1.15 2.35-1.15 3.02 0l6.28 10.86c.67 1.15-.17 2.6-1.51 2.6H3.72c-1.34 0-2.18-1.45-1.51-2.6L8.49 2.86ZM10 7a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 7Zm0 7.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
