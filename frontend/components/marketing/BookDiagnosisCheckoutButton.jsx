"use client";

import { useMemo, useState } from "react";
import Script from "next/script";
import { COLORS } from "@/lib/constants";

const { brand, accent } = COLORS;

function baseBtnClasses(disabled) {
  const disabledCls = disabled
    ? "cursor-not-allowed opacity-70"
    : "hover:brightness-110 motion-safe:hover:-translate-y-px hover:shadow-[0_0_0_1px_rgba(191,219,254,0.55),0_20px_52px_-14px_rgba(37,99,235,0.65)]";
  return `inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-full px-6 text-[14px] font-semibold tracking-tight text-white shadow-[0_12px_34px_-12px_rgba(30,58,138,0.58)] ring-1 ring-blue-200/40 transition-[transform,box-shadow,filter] duration-200 ease-out sm:w-auto sm:px-7 ${disabledCls}`;
}

export function BookDiagnosisCheckoutButton({ amount = 499, className = "" }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const style = useMemo(
    () => ({ background: `linear-gradient(135deg, ${accent} 0%, ${brand} 58%, ${brand} 100%)` }),
    []
  );

  async function handlePay() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData?.order_id || !orderData?.key) {
        throw new Error(orderData?.error || "Failed to create order.");
      }

      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Razorpay SDK is not available.");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: "INR",
        name: "Your Business",
        description: "Diagnosis Session",
        order_id: orderData.order_id,
        handler: async function (response) {
          const successRes = await fetch("/api/payment-success", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              amount: orderData.amount,
              source: "website_checkout",
            }),
          });
          const successData = await successRes.json().catch(() => ({}));
          if (!successRes.ok || successData?.status !== "ok") {
            setStatus("Payment captured but verification failed. Our team will review and contact you.");
            return;
          }
          setStatus("Payment successful. We'll contact you shortly.");
        },
        modal: {
          ondismiss: function () {
            if (!status) {
              setStatus("Payment cancelled.");
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setStatus(e?.message || "Payment failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

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
        >
          {busy ? "Processing..." : "Book Diagnosis Session"}
        </button>
        {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
      </div>
    </>
  );
}
