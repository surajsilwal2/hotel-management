"use client";
import { useState } from "react";
import { Loader2, CreditCard, CheckCircle, ExternalLink } from "lucide-react";

interface KhaltiButtonProps {
  bookingId: string;
  amount: number;
  onSuccess?: (invoiceNumber: string) => void;
}

export default function KhaltiButton({ bookingId, amount, onSuccess }: KhaltiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Initiate payment
      const initRes = await fetch("/api/payment/khalti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const initData = await initRes.json();

      if (!initData.success) {
        setError(initData.error || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      // Step 2: Open Khalti payment page in new tab
      // In production this would redirect; for demo we show the URL
      const { pidx, payment_url } = initData.data;

      // Store pidx in sessionStorage for verification after redirect
      sessionStorage.setItem("khalti_pidx", pidx);
      sessionStorage.setItem("khalti_bookingId", bookingId);

      // Redirect to Khalti
      window.open(payment_url, "_blank");

      // For demo/sandbox: auto-verify after 3 seconds
      // In production the user completes payment on Khalti and is redirected back
      setTimeout(async () => {
        const verifyRes = await fetch("/api/payment/khalti/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pidx, bookingId }),
        });
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          setPaid(true);
          onSuccess?.(verifyData.data.invoiceNumber);
        } else {
          setError(verifyData.error || "Payment verification failed");
        }
        setLoading(false);
      }, 3000);

    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Payment Successful
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#5C2D8C] hover:bg-[#4A2470] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay NPR {amount.toLocaleString()} via Khalti
            <ExternalLink className="w-3 h-3 opacity-70" />
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}

      <p className="text-xs text-slate-400 text-center">
        Secured by Khalti · eSewa and Fonepay also accepted at checkout
      </p>
    </div>
  );
}
