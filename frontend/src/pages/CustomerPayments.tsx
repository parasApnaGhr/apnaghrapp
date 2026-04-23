// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, Clock3, CreditCard, Home, Receipt, XCircle } from "lucide-react";
import api from "../utils/api";
import {
  StitchButton,
  StitchCard,
  StitchLoadingPage,
  StitchSectionHeader,
  StitchShell,
} from "../stitch/components/StitchPrimitives";
import { formatCurrency } from "../stitch/utils";

const statusConfig = {
  completed: { icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  success: { icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  pending: { icon: Clock3, className: "bg-amber-100 text-amber-700" },
  failed: { icon: XCircle, className: "bg-red-100 text-red-700" },
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CustomerPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await api.get("/customer/payments");
        setPayments(Array.isArray(response.data) ? response.data : []);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const totals = useMemo(() => {
    return payments.reduce(
      (acc, item) => {
        const amount = Number(item.amount || 0);
        acc.total += amount;
        if ((item.payment_status || item.status) === "pending") acc.pending += amount;
        return acc;
      },
      { total: 0, pending: 0 }
    );
  }, [payments]);

  if (loading) {
    return <StitchLoadingPage label="Loading payments" />;
  }

  return (
    <StitchShell
      title="Payments"
      eyebrow="History"
      actions={
        <button onClick={() => navigate("/customer/profile")} className="stitch-button stitch-button-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          <StitchCard className="p-6">
            <StitchSectionHeader title="Summary" />
            <div className="mt-6 grid gap-3">
              <div className="rounded-[26px] bg-black p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Total paid</p>
                <p className="mt-3 text-4xl font-black tracking-[-0.05em]">Rs {formatCurrency(totals.total)}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Transactions</p>
                  <p className="mt-2 text-2xl font-black">{payments.length}</p>
                </div>
                <div className="rounded-[22px] border border-[var(--stitch-line)] bg-[var(--stitch-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">Pending</p>
                  <p className="mt-2 text-2xl font-black">Rs {formatCurrency(totals.pending)}</p>
                </div>
              </div>
            </div>
          </StitchCard>
        </div>

        <StitchCard className="p-6 md:p-8">
          <StitchSectionHeader title="Transactions" />
          {payments.length === 0 ? (
            <div className="mt-8 rounded-[28px] border border-dashed border-[var(--stitch-line-strong)] p-10 text-center">
              <Receipt className="mx-auto h-8 w-8 text-[var(--stitch-muted)]" />
              <p className="mt-4 text-sm text-[var(--stitch-muted)]">No payments yet.</p>
              <StitchButton onClick={() => navigate("/customer")} className="mx-auto mt-6">
                <Home className="h-4 w-4" />
                Browse properties
              </StitchButton>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {payments.map((payment, index) => {
                const key = payment.id || index;
                const status = payment.payment_status || payment.status || "pending";
                const config = statusConfig[status] || statusConfig.pending;
                const StatusIcon = config.icon;

                return (
                  <div key={key} className="rounded-[28px] border border-[var(--stitch-line)] bg-white p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--stitch-soft)]">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-base font-black uppercase tracking-[0.08em]">
                            {payment.payment_method === "cashfree" ? "Online payment" : payment.payment_method || "Payment"}
                          </p>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                            {payment.payment_reference || payment.cf_order_id || payment.session_id || "Reference unavailable"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 md:text-right">
                        <p className="text-2xl font-black tracking-[-0.04em]">Rs {formatCurrency(payment.amount || 0)}</p>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] ${config.className}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--stitch-line)] pt-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--stitch-muted)]">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(payment.created_at)}
                      </span>
                      {payment.package_type ? <span>{payment.package_type.replaceAll("_", " ")}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </StitchCard>
      </div>
    </StitchShell>
  );
}
