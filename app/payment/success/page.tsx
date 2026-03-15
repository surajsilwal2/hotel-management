"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const pidx      = searchParams.get("pidx");
    const bookingId = sessionStorage.getItem("khalti_bookingId");

    if (!pidx || !bookingId) {
      setStatus("error");
      setErrorMsg("Invalid payment return. Please check your bookings.");
      return;
    }

    // Verify payment
    fetch("/api/payment/khalti/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pidx, bookingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInvoiceNumber(data.data.invoiceNumber);
          setStatus("success");
          sessionStorage.removeItem("khalti_pidx");
          sessionStorage.removeItem("khalti_bookingId");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Payment verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Network error during verification.");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-14 h-14 animate-spin text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Verifying Payment...</h2>
            <p className="text-slate-500 mt-2 text-sm">Please wait while we confirm with Khalti.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Payment Successful!</h2>
            <p className="text-slate-500 mt-2">Your booking has been confirmed.</p>
            {invoiceNumber && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Invoice Number</p>
                <p className="text-lg font-bold text-green-700 mt-1">{invoiceNumber}</p>
                <p className="text-xs text-green-600 mt-1">IRD-compliant invoice issued</p>
              </div>
            )}
            <Link
              href="/guest/bookings"
              className="mt-6 inline-block px-6 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors"
            >
              View My Bookings
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Payment Failed</h2>
            <p className="text-slate-500 mt-2 text-sm">{errorMsg}</p>
            <Link
              href="/guest/bookings"
              className="mt-6 inline-block px-6 py-2.5 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Go to My Bookings
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
