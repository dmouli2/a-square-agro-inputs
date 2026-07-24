"use client";

import { useActionState, useState, type FocusEvent, type FormEvent } from "react";
import { placeOrder, type CheckoutState } from "@/app/actions/checkout";
import { Button } from "@/components/ui/Button";
import { INDIA_STATES, INDIA_STATES_AND_DISTRICTS } from "@/lib/indiaLocations";

const initialState: CheckoutState = { error: null };

const inr = (value: number) =>
  value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Mirrors the server-side checks in src/app/actions/checkout.ts so a shopper sees a mistake
 *  the moment they leave a field, instead of only after a round trip to the server. */
function validateField(name: string, value: string): string | null {
  const trimmed = value.trim();
  switch (name) {
    case "fullName":
      return trimmed.length === 0 ? "Enter your full name." : null;
    case "phone":
      if (trimmed.length === 0) return "Enter your phone number.";
      return /^[6-9]\d{9}$/.test(trimmed) ? null : "Enter a valid 10-digit phone number.";
    case "line1":
      return trimmed.length === 0 ? "Enter your house / street address." : null;
    case "district":
      return trimmed.length === 0 ? "Enter your district." : null;
    case "state":
      return trimmed.length === 0 ? "Enter your state." : null;
    case "pincode":
      if (trimmed.length === 0) return "Enter your pincode.";
      return /^\d{6}$/.test(trimmed) ? null : "Enter a valid 6-digit pincode.";
    default:
      return null;
  }
}

// Top-to-bottom DOM order of the required fields, so "first invalid field" scrolling
// lands on whichever one the shopper would actually reach first while scrolling down.
const REQUIRED_FIELDS = ["fullName", "phone", "line1", "state", "district", "pincode"];

function fieldClass(hasError: boolean) {
  // text-base (16px), not text-sm — iOS Safari auto-zooms the viewport when a
  // focused input's font-size is under 16px, which happened here every time
  // native required-field validation jumped focus to an empty field on submit.
  return `h-11 w-full rounded-control border bg-surface px-3.5 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-300 focus:ring-red-200 focus:border-red-500"
      : "border-border focus:ring-primary-300 focus:border-primary-500"
  }`;
}

interface FieldProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "numeric" | "email";
  maxLength?: number;
  required?: boolean;
  error?: string | null;
  hint?: string;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

function Field({ name, label, placeholder, type = "text", inputMode, maxLength, required, error, hint, onBlur, className }: FieldProps) {
  const inputId = `checkout-${name}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-[13px] font-medium text-foreground/80 mb-1">
        {label}
        {!required && " (optional)"}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={fieldClass(Boolean(error))}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  name: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  className?: string;
}

function SelectField({
  name,
  label,
  value,
  options,
  placeholder,
  required,
  disabled,
  error,
  onChange,
  onBlur,
  className,
}: SelectFieldProps) {
  const inputId = `checkout-${name}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-[13px] font-medium text-foreground/80 mb-1">
        {label}
        {!required && " (optional)"}
      </label>
      <select
        id={inputId}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`${fieldClass(Boolean(error))} disabled:bg-border/30 disabled:text-muted disabled:cursor-not-allowed`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ subtotal }: { subtotal: number }) {
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clientErrors, setClientErrors] = useState<Record<string, string | null>>({});
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  function handleBlur(e: FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setClientErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  function handleSelectBlur(name: string, value: string) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setClientErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  function handleStateChange(value: string) {
    setSelectedState(value);
    setSelectedDistrict("");
    setTouched((prev) => ({ ...prev, state: true }));
    setClientErrors((prev) => ({ ...prev, state: validateField("state", value), district: null }));
  }

  function handleDistrictChange(value: string) {
    setSelectedDistrict(value);
    setTouched((prev) => ({ ...prev, district: true }));
    setClientErrors((prev) => ({ ...prev, district: validateField("district", value) }));
  }

  function errorFor(name: string): string | null {
    if (touched[name]) return clientErrors[name] ?? null;
    return state.fieldErrors?.[name] ?? null;
  }

  // Validates every required field up front on submit and, if anything's missing, scrolls
  // (and focuses) the first offender instead of silently doing nothing — previously a shopper
  // scrolled past the top of the form would click "Place order" and see no visible reaction
  // until they happened to scroll back down to a red-outlined field. preventDefault() here
  // stops the action prop from firing at all, per React's documented onSubmit+action behavior.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const errors: Record<string, string | null> = {};
    let firstInvalid: string | null = null;
    for (const name of REQUIRED_FIELDS) {
      const value = (formData.get(name) as string | null) ?? "";
      const error = validateField(name, value);
      errors[name] = error;
      if (error && !firstInvalid) firstInvalid = name;
    }
    if (!firstInvalid) return;

    e.preventDefault();
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(REQUIRED_FIELDS.map((name) => [name, true])) }));
    setClientErrors((prev) => ({ ...prev, ...errors }));

    const field = document.getElementById(`checkout-${firstInvalid}`);
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus({ preventScroll: true });
  }

  return (
    // noValidate: this form already has its own styled inline validation (touched-state +
    // server fieldErrors below) — without it, the browser's native required-field validation
    // jumps focus to the first empty field on submit, which zooms/breaks the layout on iOS.
    <form noValidate action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-8">
      <section className="rounded-card border border-border bg-surface p-4 flex flex-col gap-4">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2.5">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-base">📍</span>
          Delivery details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field name="fullName" label="Full name" placeholder="e.g. Ravi Kumar" required error={errorFor("fullName")} onBlur={handleBlur} className="sm:col-span-2" />
          <Field
            name="phone"
            label="Phone number"
            placeholder="10-digit mobile number"
            type="tel"
            inputMode="tel"
            maxLength={10}
            required
            error={errorFor("phone")}
            hint="We'll call this number to confirm your order."
            onBlur={handleBlur}
            className="sm:col-span-2"
          />
          <Field name="email" label="Email" placeholder="you@example.com" type="email" error={errorFor("email")} onBlur={handleBlur} className="sm:col-span-2" />
        </div>

        <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field name="line1" label="House / street" placeholder="House no., street name" required error={errorFor("line1")} onBlur={handleBlur} className="sm:col-span-2" />
          <Field name="line2" label="Landmark" placeholder="Near the water tank, etc." error={errorFor("line2")} onBlur={handleBlur} className="sm:col-span-2" />
          <Field name="village" label="Village / town" error={errorFor("village")} onBlur={handleBlur} className="sm:col-span-2" />
          <SelectField
            name="state"
            label="State"
            value={selectedState}
            options={INDIA_STATES}
            placeholder="Select state"
            required
            error={errorFor("state")}
            onChange={handleStateChange}
            onBlur={() => handleSelectBlur("state", selectedState)}
          />
          <SelectField
            name="district"
            label="District"
            value={selectedDistrict}
            options={selectedState ? INDIA_STATES_AND_DISTRICTS[selectedState] : []}
            placeholder={selectedState ? "Select district" : "Select state first"}
            required
            disabled={!selectedState}
            error={errorFor("district")}
            onChange={handleDistrictChange}
            onBlur={() => handleSelectBlur("district", selectedDistrict)}
          />
          <Field
            name="pincode"
            label="Pincode"
            inputMode="numeric"
            maxLength={6}
            required
            error={errorFor("pincode")}
            onBlur={handleBlur}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <div className="flex flex-col gap-4 md:sticky md:top-24">
        <section className="receipt-notch rounded-card border border-border bg-surface p-4 flex flex-col gap-2">
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2.5 mb-1">
            <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-base">🧾</span>
            Order summary
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="text-foreground">{inr(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Delivery</span>
            <span className="text-primary-700 font-medium">Free</span>
          </div>
          <div className="border-t border-border mt-1 pt-2 flex items-center justify-between">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-display font-bold text-lg text-foreground">{inr(subtotal)}</span>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-dashed border-border mt-2 pt-3">
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm">💰</span>
              Cash on Delivery — pay when it arrives.
            </p>
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm">🚚</span>
              Doorstep delivery, even to your village.
            </p>
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm">🔒</span>
              Your details are only used to deliver this order.
            </p>
          </div>
        </section>

        {state.error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-control px-3.5 py-2.5">
            {state.error}
          </p>
        )}

        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-30 border-t border-border bg-surface/95 backdrop-blur px-4 py-3 md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto max-w-2xl flex items-center gap-3 md:block md:max-w-none">
            <span className="flex-1 md:hidden">
              <span className="block text-xs text-muted">Total</span>
              <span className="block font-display font-bold text-foreground">{inr(subtotal)}</span>
            </span>
            <Button type="submit" size="lg" disabled={isPending} className="w-full">
              {isPending ? "Placing order…" : `Place order (Cash on Delivery)`}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
