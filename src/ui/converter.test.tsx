import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../test/msw-server";
import { Converter } from "./converter";

const DASH = "—";
const UNAVAILABLE = "Курс зараз недоступний";

/** Answers each pair from `rates`, an unknown pair with 502, and records every query. */
function fakeRates(rates: Record<string, string>, date = "2026-10-29") {
  const queries: string[] = [];
  server.use(
    http.get("*/api/rates", ({ request }) => {
      const { search, searchParams } = new URL(request.url);
      queries.push(search);
      const base = searchParams.get("base");
      const quote = searchParams.get("quote");
      const rate = rates[`${base}-${quote}`];
      return rate
        ? HttpResponse.json({ base, quote, rate, date })
        : HttpResponse.json({ error: { code: "rate_unavailable", message: "x" } }, { status: 502 });
    }),
  );
  return queries;
}

beforeEach(() => {
  fakeRates({ "USD-UAH": "45.436", "UAH-USD": "0.022009" });
});

const amountField = () => screen.getByLabelText<HTMLInputElement>("Сума");
const baseField = () => screen.getByLabelText<HTMLSelectElement>("З валюти");
const quoteField = () => screen.getByLabelText<HTMLSelectElement>("У валюту");
const swapButton = () => screen.getByRole("button", { name: "Поміняти валюти місцями" });

function optionsOf(select: HTMLSelectElement) {
  return within(select)
    .getAllByRole<HTMLOptionElement>("option")
    .map((option) => option.textContent);
}

describe("Converter form", () => {
  it("opens on USD to UAH with an empty amount and the five currencies in each field", () => {
    render(<Converter />);

    expect(screen.getByRole("heading", { name: "Конвертер валют" })).toBeInTheDocument();
    expect(amountField().value).toBe("");
    expect(baseField().value).toBe("USD");
    expect(quoteField().value).toBe("UAH");
    expect(optionsOf(baseField())).toEqual(["UAH", "USD", "EUR", "GBP", "PLN"]);
    expect(optionsOf(quoteField())).toEqual(["UAH", "USD", "EUR", "GBP", "PLN"]);
  });

  it("makes the amount a text field, so rejected text stays exactly as typed", async () => {
    const user = userEvent.setup();
    render(<Converter />);

    expect(amountField()).toHaveAttribute("type", "text");
    expect(amountField()).toHaveAttribute("inputmode", "decimal");
    await user.type(amountField(), "-1 a,b");

    expect(amountField().value).toBe("-1 a,b");
  });

  it("changes one field when the other does not hold the chosen currency", async () => {
    const user = userEvent.setup();
    render(<Converter />);

    await user.selectOptions(baseField(), "EUR");

    expect(baseField().value).toBe("EUR");
    expect(quoteField().value).toBe("UAH");
  });

  it("swaps the fields when the base is given the quote's currency", async () => {
    const user = userEvent.setup();
    render(<Converter />);

    await user.selectOptions(baseField(), "UAH");

    expect(baseField().value).toBe("UAH");
    expect(quoteField().value).toBe("USD");
  });

  it("swaps the fields when the quote is given the base's currency", async () => {
    const user = userEvent.setup();
    render(<Converter />);

    await user.selectOptions(quoteField(), "USD");

    expect(baseField().value).toBe("UAH");
    expect(quoteField().value).toBe("USD");
  });

  it("reverses the pair with the swap control and keeps the amount", async () => {
    const user = userEvent.setup();
    render(<Converter />);
    await user.type(amountField(), "100");

    await user.click(swapButton());

    expect(baseField().value).toBe("UAH");
    expect(quoteField().value).toBe("USD");
    expect(amountField().value).toBe("100");
  });

  it("reaches all four controls in order with Tab", async () => {
    const user = userEvent.setup();
    render(<Converter />);

    await user.tab();
    expect(amountField()).toHaveFocus();
    await user.tab();
    expect(baseField()).toHaveFocus();
    await user.tab();
    expect(swapButton()).toHaveFocus();
    await user.tab();
    expect(quoteField()).toHaveFocus();
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("operates the swap control with %s", async (_name, key) => {
    const user = userEvent.setup();
    render(<Converter />);

    swapButton().focus();
    await user.keyboard(key);

    expect(baseField().value).toBe("UAH");
    expect(quoteField().value).toBe("USD");
  });

  it("marks every control with a visible focus style", () => {
    render(<Converter />);

    for (const control of [amountField(), baseField(), swapButton(), quoteField()]) {
      expect(control.className).toMatch(/focus-visible:/);
    }
  });
});

describe("Converter rate states", () => {
  it("shows a dash, then the rate and its date exactly as published", async () => {
    render(<Converter />);

    expect(screen.getByText(DASH)).toBeInTheDocument();
    expect(await screen.findByText("1 USD = 45,436 UAH")).toBeInTheDocument();
    expect(screen.getByText("29.10.2026")).toBeInTheDocument();
    expect(screen.queryByText(DASH)).not.toBeInTheDocument();
  });

  it("shows the source's rate date rather than today's", async () => {
    fakeRates({ "USD-UAH": "45.436" }, "2019-03-04");
    render(<Converter />);

    expect(await screen.findByText("04.03.2019")).toBeInTheDocument();
  });

  it("shows the unavailable message with no text from the reply", async () => {
    server.use(
      http.get("*/api/rates", () =>
        HttpResponse.json({ error: { code: "x", message: "upstream secret" } }, { status: 502 }),
      ),
    );
    render(<Converter />);

    expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();
    expect(screen.queryByText(/upstream secret/)).not.toBeInTheDocument();
    expect(screen.queryByText(DASH)).not.toBeInTheDocument();
  });

  it("treats an unexpected reply as unavailable", async () => {
    server.use(http.get("*/api/rates", () => HttpResponse.json({ rate: "upstream secret" })));
    render(<Converter />);

    expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();
    expect(screen.queryByText(/upstream secret/)).not.toBeInTheDocument();
  });

  it("keeps the amount and currencies, and does not retry, when typing after a failure", async () => {
    const user = userEvent.setup();
    const queries = fakeRates({});
    render(<Converter />);
    await screen.findByText(UNAVAILABLE);

    await user.type(amountField(), "100");

    expect(queries).toEqual(["?base=USD&quote=UAH"]);
    expect(amountField().value).toBe("100");
    expect(baseField().value).toBe("USD");
    expect(quoteField().value).toBe("UAH");
    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
  });

  it("replaces the unavailable message with a dash and a new request on a change of pair", async () => {
    const user = userEvent.setup();
    fakeRates({});
    render(<Converter />);
    await screen.findByText(UNAVAILABLE);

    const later: string[] = [];
    server.use(
      http.get("*/api/rates", ({ request }) => {
        later.push(new URL(request.url).search);
        return new Promise<Response>(() => {});
      }),
    );
    await user.selectOptions(baseField(), "EUR");

    expect(screen.getByText(DASH)).toBeInTheDocument();
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
    await waitFor(() => expect(later).toEqual(["?base=EUR&quote=UAH"]));
  });

  it("requests the new direction's published rate on swap, never an inverted copy", async () => {
    const user = userEvent.setup();
    const queries = fakeRates({ "USD-UAH": "45.436", "UAH-USD": "0.022009" });
    render(<Converter />);
    await screen.findByText("1 USD = 45,436 UAH");

    await user.click(swapButton());

    expect(screen.queryByText("1 USD = 45,436 UAH")).not.toBeInTheDocument();
    expect(await screen.findByText("1 UAH = 0,022009 USD")).toBeInTheDocument();
    expect(queries).toEqual(["?base=USD&quote=UAH", "?base=UAH&quote=USD"]);
  });

  it("removes the old rate and date at once when the pair changes", async () => {
    const user = userEvent.setup();
    render(<Converter />);
    await screen.findByText("1 USD = 45,436 UAH");

    server.use(http.get("*/api/rates", () => new Promise<Response>(() => {})));
    await user.selectOptions(baseField(), "EUR");

    expect(screen.getByText(DASH)).toBeInTheDocument();
    expect(screen.queryByText("1 USD = 45,436 UAH")).not.toBeInTheDocument();
    expect(screen.queryByText("29.10.2026")).not.toBeInTheDocument();
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
  });

  it("stays on the selected pair when replies arrive out of order", async () => {
    const user = userEvent.setup();
    const held = new Map<string, (reply: Response) => void>();
    server.use(
      http.get("*/api/rates", ({ request }) => {
        const base = new URL(request.url).searchParams.get("base") as string;
        return new Promise<Response>((release) => held.set(base, release));
      }),
    );
    render(<Converter />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    await user.selectOptions(baseField(), "EUR");
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    await act(async () => {
      held.get("EUR")?.(
        HttpResponse.json({ base: "EUR", quote: "UAH", rate: "50.1", date: "2026-10-29" }),
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    await act(async () => {
      held.get("USD")?.(new HttpResponse(null, { status: 502 }));
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(screen.getByText("1 EUR = 50,1 UAH")).toBeInTheDocument();
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
  });

  it("starts over as USD to UAH with an empty amount on a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Converter />);
    await user.type(amountField(), "5");
    await user.click(swapButton());
    unmount();

    render(<Converter />);

    expect(amountField().value).toBe("");
    expect(baseField().value).toBe("USD");
    expect(await screen.findByText("1 USD = 45,436 UAH")).toBeInTheDocument();
  });
});
