import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Converter } from "./converter";

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
