// Fumaça da E1: o shell monta em jsdom com Testing Library.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../../src/App";

describe("App (E1)", () => {
  it("monta e mostra o título do portal", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Atlas" })).toBeTruthy();
  });
});
