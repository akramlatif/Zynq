import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  addProductSchema,
  generateBillSchema,
  addUdhaarSchema,
  paginationSchema,
} from "../../../shared/src/validators/index";

describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    const result = loginSchema.safeParse({
      email_or_phone: "owner@zynq.pk",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email_or_phone: "owner@zynq.pk",
      password: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Akram Latif",
    email: "akram@example.com",
    phone: "03001234567",
    password: "securepass123",
    shop_name: "Latif General Store",
    business_type: "kiryana",
  };

  it("accepts a valid Pakistani registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts +92 prefixed numbers", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "+923001234567" }).success).toBe(true);
  });

  it("rejects an invalid Pakistani phone number", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });
});

describe("addProductSchema", () => {
  it("accepts a valid product and defaults unit and alert_threshold", () => {
    const result = addProductSchema.safeParse({
      name: "Lays Chips",
      quantity: 50,
      price: 60,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBe("piece");
      expect(result.data.alert_threshold).toBe(5);
    }
  });

  it("rejects a negative quantity", () => {
    expect(
      addProductSchema.safeParse({ name: "X", quantity: -5, price: 10 }).success
    ).toBe(false);
  });
});

describe("generateBillSchema", () => {
  it("accepts a valid bill with items", () => {
    const result = generateBillSchema.safeParse({
      items: [{ name: "Bread", qty: 2 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payment_method).toBe("cash");
    }
  });

  it("rejects a bill with no items", () => {
    expect(generateBillSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("rejects qty of 0 on a bill item", () => {
    expect(
      generateBillSchema.safeParse({ items: [{ name: "Bread", qty: 0 }] }).success
    ).toBe(false);
  });
});

describe("addUdhaarSchema", () => {
  it("accepts a valid udhaar entry", () => {
    const result = addUdhaarSchema.safeParse({
      customer_name: "Rahim",
      amount: 1500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an amount of 0", () => {
    expect(
      addUdhaarSchema.safeParse({ customer_name: "Rahim", amount: 0 }).success
    ).toBe(false);
  });

  it("rejects an invalid customer phone", () => {
    expect(
      addUdhaarSchema.safeParse({
        customer_name: "Rahim",
        amount: 500,
        customer_phone: "999",
      }).success
    ).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("defaults page and limit when omitted", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort_order).toBe("desc");
    }
  });

  it("coerces string page numbers", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects a limit above 100", () => {
    expect(paginationSchema.safeParse({ limit: 500 }).success).toBe(false);
  });
});
