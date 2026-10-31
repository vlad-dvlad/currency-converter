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

const CONTROL =
  "rounded border border-gray-400 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

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
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">{messages.heading}</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor={amountId}>{messages.amountLabel}</label>
        <input
          id={amountId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amountText}
          aria-invalid={rejected}
          aria-describedby={rejected ? amountMessageId : undefined}
          onChange={(event) => setAmountText(event.target.value)}
          className={CONTROL}
        />
        {rejected && <p id={amountMessageId}>{messages.amountRejected}</p>}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <CurrencyField label={messages.baseLabel} value={pair.base} onChoose={choose("base")} />
        <button type="button" onClick={() => setPair(swapPair)} className={CONTROL}>
          {messages.swap}
        </button>
        <CurrencyField label={messages.quoteLabel} value={pair.quote} onChoose={choose("quote")} />
      </div>

      <div role="status" className="flex flex-col gap-1">
        {result !== null && (
          <>
            <p className="text-2xl font-semibold">{result}</p>
            <p>{messages.referenceLabel}</p>
          </>
        )}
        <RateLine state={rate} />
      </div>
    </div>
  );
}

function RateLine({ state }: { state: RateState }) {
  if (state.status === "pending") return <p>{messages.ratePending}</p>;
  if (state.status === "unavailable") return <p>{messages.rateUnavailable}</p>;
  return (
    <>
      <p>{formatRate(state.rate)}</p>
      <p>{formatRateDate(state.rate.date)}</p>
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
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChoose(event.target.value as Currency)}
        className={CONTROL}
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </div>
  );
}
