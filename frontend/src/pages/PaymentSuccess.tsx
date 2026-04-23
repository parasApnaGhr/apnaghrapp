// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle2, Home, Loader2, Megaphone, Package, XCircle } from "lucide-react";
import { toast } from "sonner";
import { paymentAPI, visitAPI } from "../utils/api";
import { StitchButton, StitchCard, StitchShell } from "../stitch/components/StitchPrimitives";
import { formatCurrency } from "../stitch/utils";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking");
  const [transaction, setTransaction] = useState(null);
  const [visitBooked, setVisitBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const orderId = searchParams.get("order_id") || searchParams.get("session_id");
  const paymentType = searchParams.get("type");

  const autoBookVisit = useCallback(async () => {
    const pendingBookingStr = localStorage.getItem("pendingVisitBooking");
    if (!pendingBookingStr) return;

    try {
      const pendingBooking = JSON.parse(pendingBookingStr);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await visitAPI.bookVisit({
        property_ids: pendingBooking.property_ids,
        scheduled_date: pendingBooking.scheduled_date,
        scheduled_time: pendingBooking.scheduled_time,
        pickup_location: pendingBooking.pickup_location,
        pickup_lat: pendingBooking.pickup_lat,
        pickup_lng: pendingBooking.pickup_lng,
      });

      setVisitBooked(true);
      setBookingDetails(response.data);
      localStorage.removeItem("pendingVisitBooking");
      localStorage.removeItem("visitCart");
      toast.success("Visit scheduled");
    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      if (message?.includes("No available visit credits")) {
        toast.info("Package added. Book your visit now.");
        localStorage.removeItem("visitCart");
      } else {
        toast.error("Payment succeeded. Book the visit from your dashboard.");
      }
    }
  }, []);

  const pollPaymentStatus = useCallback(
    async (attempt = 0) => {
      if (!orderId) {
        setStatus("error");
        return;
      }

      if (attempt >= 20) {
        setStatus("timeout");
        return;
      }

      try {
        const response = await paymentAPI.getPaymentStatus(orderId);
        setTransaction(response.data);
        const paymentStatus = response.data?.payment_status?.toLowerCase();

        if (paymentStatus === "paid" || paymentStatus === "success") {
          setStatus("success");
          await autoBookVisit();
          return;
        }

        if (["failed", "cancelled", "expired"].includes(paymentStatus)) {
          setStatus("error");
          return;
        }
      } catch {
        // keep polling
      }

      setTimeout(() => pollPaymentStatus(attempt + 1), 2000);
    },
    [autoBookVisit, orderId]
  );

  useEffect(() => {
    pollPaymentStatus();
  }, [pollPaymentStatus]);

  const successInfo = useMemo(() => {
    const type = transaction?.metadata?.type || paymentType;
    const packageType = transaction?.package_type;

    if (type === "packers" || packageType?.startsWith("packers_")) {
      return {
        title: "Booking confirmed",
        message: "Packers booking created.",
        icon: Package,
        buttonText: "Open packers",
        redirectTo: "/customer/packers",
      };
    }

    if (type === "advertising" || packageType?.startsWith("ads_")) {
      return {
        title: "Campaign submitted",
        message: "Advertising payment received.",
        icon: Megaphone,
        buttonText: "Open advertising",
        redirectTo: "/customer/advertise",
      };
    }

    if (visitBooked && bookingDetails) {
      return {
        title: "Visit scheduled",
        message: `${bookingDetails.scheduled_date} at ${bookingDetails.scheduled_time}`,
        icon: Calendar,
        buttonText: "Open bookings",
        redirectTo: "/customer/bookings",
      };
    }

    return {
      title: "Payment verified",
      message: "Your payment was processed successfully.",
      icon: Home,
      buttonText: "Go home",
      redirectTo: "/customer",
    };
  }, [bookingDetails, paymentType, transaction, visitBooked]);

  const StateIcon = successInfo.icon;

  return (
    <StitchShell title="Payment" compact>
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-10">
        {status === "checking" ? (
          <StitchCard className="w-full p-8 text-center md:p-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-black text-white">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="mt-8 text-4xl font-black uppercase tracking-[-0.06em]">Processing</h2>
            <p className="mt-3 text-sm text-[var(--stitch-muted)]">Verifying payment status.</p>
          </StitchCard>
        ) : null}

        {status === "success" ? (
          <StitchCard className="w-full p-8 text-center md:p-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-black text-white">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-8 text-5xl font-black uppercase tracking-[-0.08em]">{successInfo.title}</h2>
            <p className="mt-4 text-sm text-[var(--stitch-muted)]">{successInfo.message}</p>
            {transaction ? (
              <div className="mt-8 rounded-[28px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Amount</p>
                <p className="mt-3 text-4xl font-black tracking-[-0.05em]">Rs {formatCurrency(transaction.amount || 0)}</p>
              </div>
            ) : null}
            <div className="mt-8 flex justify-center">
              <StitchButton onClick={() => navigate(successInfo.redirectTo)}>
                <StateIcon className="h-4 w-4" />
                {successInfo.buttonText}
                <ArrowRight className="h-4 w-4" />
              </StitchButton>
            </div>
          </StitchCard>
        ) : null}

        {status === "timeout" ? (
          <StitchCard className="w-full p-8 text-center md:p-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--stitch-soft)]">
              <Loader2 className="h-10 w-10" />
            </div>
            <h2 className="mt-8 text-4xl font-black uppercase tracking-[-0.06em]">Still processing</h2>
            <p className="mt-3 text-sm text-[var(--stitch-muted)]">Check your dashboard in a few minutes.</p>
            <div className="mt-8">
              <StitchButton onClick={() => navigate("/customer")}>
                <Home className="h-4 w-4" />
                Go home
              </StitchButton>
            </div>
          </StitchCard>
        ) : null}

        {status === "error" ? (
          <StitchCard className="w-full p-8 text-center md:p-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-700">
              <XCircle className="h-10 w-10" />
            </div>
            <h2 className="mt-8 text-4xl font-black uppercase tracking-[-0.06em]">Payment failed</h2>
            <p className="mt-3 text-sm text-[var(--stitch-muted)]">Something went wrong while verifying this payment.</p>
            <div className="mt-8">
              <StitchButton onClick={() => navigate("/customer")}>
                <Home className="h-4 w-4" />
                Go home
              </StitchButton>
            </div>
          </StitchCard>
        ) : null}
      </div>
    </StitchShell>
  );
}
