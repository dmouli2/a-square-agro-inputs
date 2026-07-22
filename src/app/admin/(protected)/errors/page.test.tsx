import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ErrorLogEntry } from "@/types";

const list = vi.fn();

vi.mock("@/lib/db", () => ({
  getDb: () => ({ errorLogs: { list } }),
}));

import AdminErrorsPage from "./page";

const entry: ErrorLogEntry = {
  id: "err-1",
  message: "connection refused",
  stack: "Error: connection refused\n    at placeOrder",
  path: "/cart",
  createdAt: "2026-07-22T10:30:00.000Z",
};

describe("AdminErrorsPage", () => {
  beforeEach(() => {
    list.mockReset();
  });

  it("renders an empty-state message when there are no errors", async () => {
    list.mockResolvedValue([]);
    const jsx = await AdminErrorsPage();
    render(jsx);
    expect(screen.getByText("No errors logged yet.")).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith(100);
  });

  it("renders a row per error with message, stack, and path", async () => {
    list.mockResolvedValue([entry]);
    const jsx = await AdminErrorsPage();
    render(jsx);

    expect(screen.getByText("connection refused")).toBeInTheDocument();
    expect(screen.getByText(/at placeOrder/)).toBeInTheDocument();
    expect(screen.getByText("/cart")).toBeInTheDocument();
    expect(screen.getByText("1 server-side error", { exact: false })).toBeInTheDocument();
  });

  it("shows an em dash when the path is missing and omits the stack block when absent", async () => {
    list.mockResolvedValue([{ ...entry, path: undefined, stack: undefined }]);
    const jsx = await AdminErrorsPage();
    render(jsx);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/at placeOrder/)).not.toBeInTheDocument();
  });

  it("pluralizes the summary count for more than one error", async () => {
    list.mockResolvedValue([entry, { ...entry, id: "err-2" }]);
    const jsx = await AdminErrorsPage();
    render(jsx);

    expect(screen.getByText("2 server-side errors", { exact: false })).toBeInTheDocument();
  });
});
