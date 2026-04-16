"use client";

import { useCallback, useMemo, useState } from "react";
import Script from "next/script";
import { COLORS } from "@/lib/constants";
import { checkoutFetch, parseCheckoutJson } from "@/lib/checkoutClient";

const { brand, accent } = COLORS;

function baseBtnClasses(disabled) {
  const disabledCls = disabled
    ? "cursor-not-allowed opacity-70"
    : "hover:brightness-110 motion-safe:hover:-translate-y-px hover:shadow-[0_0_0_1px_rgba(191,219,254,0.55),0_20px_52px_-14px_rgba(37,99,235,0.65)]";
  return `inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full px-6 text-[14px] font-semibold tracking-tight text-white shadow-[0_12px_34px_-12px_rgba(30,58,138,0.58)] ring-1 ring-blue-200/40 transition-[transform,box-shadow,filter] duration-200 ease-out sm:w-auto sm:px-7 ${disabledCls}`;
}

function friendlyError(data, status) {
  const err = data?.error;
  if (
    err === "server_returned_non_json" ||
    err === "checkout_upstream_error" ||
    err === "checkout_upstream_invalid_json"
  ) {
    return "Checkout service is temporarily unavailable. Please try again in a moment.";
  }
  if (err === "invalid_json" || err === "empty_response") {
    return "We could not reach the payment service. Check your connection and try again.";
  }
  if (status === 404) {
    return "Payment setup is not available on this host. Our team has been notified — use WhatsApp to book, or try again later.";
  }
  if (status === 503 || err === "razorpay not configured") {
    return "Payments are not configured yet. Please contact us to complete booking.";
  }
  if (typeof err === "string" && err.trim()) {
    return err.length > 160 ? `${err.slice(0, 157)}…` : err;
  }
  return "Something went wrong starting checkout. Please try again.";
}

export function BookDiagnosisCheckoutButton({ amount = 499, className = "" }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | error
  const [status, setStatus] = useState("");
  const [lastOrder, setLastOrder] = useState(null);

  const style = useMemo(
    () => ({ background: `linear-gradient(135deg, ${accent} 0%, ${brand} 58%, ${brand} 100%)` }),
    []
  );

  const logCheckoutFailure = useCallback(async (payload) => {
    try {
      const failRes = await checkoutFetch("/api/payment-failed", payload);
      await parseCheckoutJson(failRes);
    } catch {
      // best-effort logging only
    }
  }, []);

  const openCheckout = useCallback(
    async (orderData) => {
      if (typeof window === "undefined" || !window.Razorpay) {
        setPhase("error");
        setStatus("Payment widget failed to load. Refresh the page and try again.");
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: "INR",
        name: "Your Business",
        description: "Diagnosis Session",
        order_id: orderData.order_id,
        config: {
          display: {
            hide: [
              { method: "emi" },
              { method: "paylater" },
            ],
            blocks: {
              upi: {
                name: "UPI (Fastest)",
                instruments: [{ method: "upi" }],
              },
              card: {
                name: "Cards",
                instruments: [{ method: "card" }],
              },
              netbanking: {
                name: "Netbanking",
                instruments: [{ method: "netbanking" }],
              },
            },
            sequence: ["block.upi", "block.card", "block.netbanking"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
        handler: async function (response) {
          setPhase("loading");
          setStatus("Verifying payment...");
          try {
            const successRes = await checkoutFetch("/api/payment-success", {
              ...response,
              amount: orderData.amount,
              source: "website_checkout",
            });
            const { ok: sOk, data: successData, status: sStatus } = await parseCheckoutJson(successRes);
            if (!sOk || successData?.status !== "ok") {
              setPhase("error");
              setStatus(friendlyError(successData, sStatus));
              return;
            }
            setPhase("idle");
            setStatus("Payment successful. We'll contact you shortly.");
            setLastOrder(null);
          } catch {
            setPhase("error");
            setStatus("We could not verify the payment. If you were charged, contact us with your receipt.");
          }
        },
        modal: {
          ondismiss: function () {
            setStatus((prev) => (prev === "Verifying payment..." ? prev : "Payment cancelled."));
          },
        },
      };
      console.log("Razorpay key prefix:", String(options.key || "").slice(0, 8));
      if (
        (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "production") &&
        !String(options.key || "").startsWith("rzp_live_")
      ) {
        setPhase("error");
        setStatus("LIVE KEY MISSING");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async function (resp) {
        const err = resp?.error || {};
        await logCheckoutFailure({
          source: "website_checkout",
          amount: orderData.amount,
          step: "payment_failed_callback",
          razorpay_order_id: String(err.metadata?.order_id || orderData.order_id || ""),
          razorpay_payment_id: String(err.metadata?.payment_id || ""),
          error_code: String(err.code || ""),
          error_description: String(err.description || ""),
          reason: String(err.reason || "payment_failed"),
        });
        setPhase("error");
        setStatus("Payment failed. Please try again using UPI or another method.");
      });
      rzp.open();
    },
    [logCheckoutFailure]
  );

  async function handlePay() {
    if (phase === "loading") return;
    setPhase("loading");
    setStatus("");
    try {
      const orderRes = await checkoutFetch("/api/create-order", { amount });
      const { ok, data: orderData, status: orderStatus } = await parseCheckoutJson(orderRes);
      console.log("Razorpay key prefix:", String(orderData?.key || "").slice(0, 8));

      if (!ok || !orderData?.order_id || !orderData?.key) {
        setPhase("error");
        setStatus(friendlyError(orderData, orderStatus));
        return;
      }
      setLastOrder(orderData);
      setPhase("idle");
      await openCheckout(orderData);
    } catch {
      setPhase("error");
      setStatus("Network error. Check your connection and try again.");
    }
  }

  const busy = phase === "loading";
  const isError = phase === "error" && status;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="w-full">
        <button
          type="button"
          onClick={handlePay}
          disabled={busy}
          className={[baseBtnClasses(busy), className].filter(Boolean).join(" ")}
          style={style}
          aria-busy={busy}
        >
          {busy ? "Opening checkout…" : "Book Diagnosis Session"}
        </button>
        <p className="mt-2 text-xs text-blue-700">Use UPI for fastest checkout.</p>
        {busy && !status ? (
          <p className="mt-3 text-sm text-slate-500" role="status">
            Connecting to secure payment…
          </p>
        ) : null}
        {status ? (
          <p
            className={`mt-3 text-sm ${isError || status === "Payment cancelled." ? "text-amber-800" : "text-slate-600"}`}
            role={isError ? "alert" : "status"}
          >
            {status}
          </p>
        ) : null}
        {phase === "error" && lastOrder ? (
          <button
            type="button"
            onClick={() => openCheckout(lastOrder)}
            className="mt-3 inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Retry payment
          </button>
        ) : null}
      </div>
    </>
  );
}
