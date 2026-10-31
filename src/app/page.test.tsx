import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../test/msw-server";
import Home from "./page";

describe("Home", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/rates", () =>
        HttpResponse.json({ base: "USD", quote: "UAH", rate: "45.436", date: "2026-10-29" }),
      ),
    );
  });

  it("opens on USD to UAH with an empty amount and the five currencies", async () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Конвертер валют" })).toBeInTheDocument();
    expect(screen.getByLabelText("Сума")).toHaveValue("");
    expect(screen.getByLabelText("З валюти")).toHaveValue("USD");
    expect(screen.getByLabelText("У валюту")).toHaveValue("UAH");
    for (const label of ["З валюти", "У валюту"]) {
      const options = within(screen.getByLabelText(label)).getAllByRole("option");
      expect(options.map((option) => option.textContent)).toEqual([
        "UAH",
        "USD",
        "EUR",
        "GBP",
        "PLN",
      ]);
    }
    expect(await screen.findByText("1 USD = 45,436 UAH")).toBeInTheDocument();
  });
});
