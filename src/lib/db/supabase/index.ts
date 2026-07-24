import type { Database } from "@/lib/db/types";
import { createMockDb } from "@/lib/db/mock";
import { createSupabaseCategoryRepository } from "./categoryRepository";
import { createSupabaseProductRepository } from "./productRepository";
import { createSupabaseOrderRepository } from "./orderRepository";
import { createSupabaseStaffRepository } from "./staffRepository";
import { createSupabaseCustomerRepository } from "./customerRepository";
import { createSupabaseRateLimiterRepository } from "./rateLimitRepository";
import { createSupabaseLoginRateLimiterRepository } from "./loginRateLimitRepository";
import { createSupabaseErrorLogRepository } from "./errorLogRepository";

export function createSupabaseDb(): Database {
  const mock = createMockDb();
  return {
    categories: createSupabaseCategoryRepository(),
    products: createSupabaseProductRepository(),
    orders: createSupabaseOrderRepository(),
    coupons: mock.coupons,
    staff: createSupabaseStaffRepository(),
    customers: createSupabaseCustomerRepository(),
    rateLimiter: createSupabaseRateLimiterRepository(),
    loginRateLimiter: createSupabaseLoginRateLimiterRepository(),
    errorLogs: createSupabaseErrorLogRepository(),
  };
}
