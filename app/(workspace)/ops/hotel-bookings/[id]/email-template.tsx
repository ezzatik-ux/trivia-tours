"use client";

import { useState, useMemo, useTransition } from "react";
import { Copy, Check, Mail, Loader2 } from "lucide-react";
import { markEmailSent } from "../../hotel-queue/actions";

type Props = {
  bookingId: string;
  bookingNo: string;
  hotelName: string | null;
  hotelReservationEmail: string | null;
  customerName: string;
  customerNationality: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  numRooms: number;
  occupancy: string;
  adults: number;
  children: number;
  roomTypeName: string | null;
  roomBedConfig: string | null;
  roomView: string | null;
  mealPlan: string | null;
  specialRequests: string | null;
  emailSentToHotel: boolean;
  emailSentAt: Date | null;
};

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: "Room Only",
  BB: "Bed & Breakfast",
  HB: "Half Board",
  FB: "Full Board",
  AI: "All Inclusive",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function EmailTemplate(props: Props) {
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);
  const [isPending, startTransition] = useTransition();

  const subject = useMemo(() => {
    return `Reservation Request - ${props.customerName} - ${formatDate(props.checkIn)} - Ref: ${props.bookingNo}`;
  }, [props.customerName, props.checkIn, props.bookingNo]);

  const body = useMemo(() => {
    const mealPlan = props.mealPlan
      ? MEAL_PLAN_LABELS[props.mealPlan] ?? props.mealPlan
      : "Not specified";

    return `Dear Reservations Team,

We would like to confirm a reservation with the following details:

GUEST INFORMATION
─────────────────
Name: ${props.customerName}${props.customerNationality ? `\nNationality: ${props.customerNationality}` : ""}

STAY DETAILS
─────────────────
Check-in: ${formatDate(props.checkIn)}
Check-out: ${formatDate(props.checkOut)}
Nights: ${props.nights}

ROOM REQUEST
─────────────────
Room Type: ${props.roomTypeName ?? "—"}${props.roomBedConfig ? `\nBed Configuration: ${props.roomBedConfig}` : ""}${props.roomView ? `\nView: ${props.roomView}` : ""}
Number of Rooms: ${props.numRooms}
Occupancy: ${props.occupancy.charAt(0) + props.occupancy.slice(1).toLowerCase()}
Adults: ${props.adults}${props.children > 0 ? `\nChildren: ${props.children}` : ""}
Meal Plan: ${mealPlan}
${props.specialRequests ? `\nSPECIAL REQUESTS\n─────────────────\n${props.specialRequests}\n` : ""}
BOOKING REFERENCE
─────────────────
Our Reference: ${props.bookingNo}

Please confirm availability and send us your confirmation number at your earliest convenience.

Thank you for your partnership.

Best regards,
Trivia Egypt
Travel Operations Team
+201019911016
operations@triviaeg.com`;
  }, [props]);

  async function handleCopy(text: string, which: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  function handleOpenInGmail() {
    const mailto = `mailto:${props.hotelReservationEmail ?? ""}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  }

  function handleMarkSent() {
    startTransition(async () => {
      await markEmailSent(props.bookingId);
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-trivia-600" />
          <h3 className="font-semibold text-slate-900">Email Hotel</h3>
        </div>
        {props.emailSentToHotel && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full font-medium">
            <Check className="w-3 h-3" />
            Sent {props.emailSentAt ? new Date(props.emailSentAt).toLocaleDateString() : ""}
          </div>
        )}
      </div>

      {/* Recipient */}
      <div className="mb-3 p-3 bg-slate-50 rounded-lg">
        <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">To</div>
        <div className="font-mono text-sm text-slate-900">
          {props.hotelReservationEmail || (
            <span className="text-slate-400 italic">
              No reservation email on file — add it in hotel admin
            </span>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Subject</div>
          <button
            onClick={() => handleCopy(subject, "subject")}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-trivia-600"
          >
            {copied === "subject" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === "subject" ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-900 font-medium">{subject}</div>
      </div>

      {/* Body */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Body</div>
          <button
            onClick={() => handleCopy(body, "body")}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-trivia-600"
          >
            {copied === "body" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === "body" ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-900 font-mono whitespace-pre-wrap max-h-48 md:max-h-64 overflow-y-auto">
          {body}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        {props.hotelReservationEmail && (
          <button
            onClick={handleOpenInGmail}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-trivia-500 hover:bg-trivia-600 text-white rounded-lg text-sm font-medium shadow-sm"
          >
            <Mail className="w-4 h-4" />
            Open in mail app
          </button>
        )}
        <button
          onClick={() => handleCopy(`Subject: ${subject}\n\n${body}`, "body")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy all (for Gmail web)
        </button>
        {!props.emailSentToHotel && (
          <button
            onClick={handleMarkSent}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Mark sent
          </button>
        )}
      </div>

      <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
        💡 Tip: &quot;Open in mail app&quot; uses your default mail client. For Gmail web,
        use &quot;Copy all&quot; and paste into a new compose window.
      </p>
    </div>
  );
}
