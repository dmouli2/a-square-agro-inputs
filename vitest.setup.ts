import "@testing-library/jest-dom/vitest";
import { vi, beforeEach } from "vitest";
import React from "react";

// ---- next/navigation --------------------------------------------------
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

// ---- next/headers -------------------------------------------------------
const cookieStoreValues = new Map<string, string>();

export const mockCookieStore = {
  get: vi.fn((name: string) => {
    const value = cookieStoreValues.get(name);
    return value === undefined ? undefined : { name, value };
  }),
  set: vi.fn((name: string, value: string) => {
    cookieStoreValues.set(name, value);
  }),
  delete: vi.fn((name: string) => {
    cookieStoreValues.delete(name);
  }),
};

export const mockHeadersStore = {
  get: vi.fn((): string | null => null),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
  headers: vi.fn(async () => mockHeadersStore),
}));

// ---- next/cache -----------------------------------------------------------
export const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

// ---- next/font/google ----------------------------------------------------
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-body", className: "inter" }),
  Plus_Jakarta_Sans: () => ({ variable: "--font-heading", className: "plus-jakarta-sans" }),
}));

// ---- next/image ------------------------------------------------------------
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => React.createElement("img", props),
}));

// ---- DOM-only shims ---------------------------------------------------------
if (typeof window !== "undefined") {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 800,
    height: 480,
    top: 0,
    left: 0,
    right: 800,
    bottom: 480,
    x: 0,
    y: 0,
    toJSON() {},
  })) as unknown as () => DOMRect;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.forward.mockClear();
  mockRouter.refresh.mockClear();
  mockRouter.prefetch.mockClear();
  mockCookieStore.get.mockClear();
  mockCookieStore.set.mockClear();
  mockCookieStore.delete.mockClear();
  cookieStoreValues.clear();
  mockRevalidatePath.mockClear();
  mockHeadersStore.get.mockReset();
  mockHeadersStore.get.mockReturnValue(null);
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});
