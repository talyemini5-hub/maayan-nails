"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { StepIndicator } from "./step-indicator";
import { TreatmentStep } from "./treatment-step";
import { AddonsStep } from "./addons-step";
import { DateStep } from "./date-step";
import { TimeStep } from "./time-step";
import { DetailsStep } from "./details-step";
import { SummaryStep } from "./summary-step";
import { ConfirmationStep } from "./confirmation-step";
import type { CustomerDetailsInput } from "@/lib/validation/booking";
import type { Appointment, Service } from "@/types/database";
import { initialBookingState, type AvailableSlot, type BookingState, type WizardStep } from "./types";

const SUBMIT_ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: "מצטערים, השעה הזו נתפסה ממש עכשיו. נא לבחור שעה אחרת.",
  SLOT_IN_PAST: "לא ניתן לקבוע תור בזמן שכבר עבר. נא לבחור שעה אחרת.",
  SERVICE_NOT_BOOKABLE: "הטיפול הזה אינו זמין כרגע לקביעת תור אונליין.",
  VALIDATION_ERROR: "חלק מהפרטים אינם תקינים. נא לבדוק ולנסות שוב.",
};

export function BookingWizard({
  treatments,
  addonsByService,
  cancellationPolicyText,
  bookingHorizonDays,
  preselectedTreatmentId,
}: {
  treatments: Service[];
  addonsByService: Record<string, Service[]>;
  cancellationPolicyText: string;
  bookingHorizonDays: number;
  preselectedTreatmentId?: string;
}) {
  const preselected = preselectedTreatmentId ? treatments.find((t) => t.id === preselectedTreatmentId) ?? null : null;
  const [step, setStep] = useState<WizardStep>(preselected ? "addons" : "treatment");
  const [state, setState] = useState<BookingState>({ ...initialBookingState, treatment: preselected });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const currentAddons = useMemo(
    () => (state.treatment ? addonsByService[state.treatment.id] ?? [] : []),
    [state.treatment, addonsByService]
  );
  const addonsById = useMemo(() => new Map(currentAddons.map((a) => [a.id, a])), [currentAddons]);

  function goTo(next: WizardStep) {
    setSubmitError(null);
    setStep(next);
  }

  function selectTreatment(treatment: Service) {
    setState((s) => ({ ...s, treatment, selectedAddonIds: [], date: null, slot: null }));
  }

  function toggleAddon(addonId: string) {
    setState((s) => ({
      ...s,
      selectedAddonIds: s.selectedAddonIds.includes(addonId)
        ? s.selectedAddonIds.filter((id) => id !== addonId)
        : [...s.selectedAddonIds, addonId],
    }));
  }

  function selectDate(date: string) {
    setState((s) => ({ ...s, date, slot: null }));
  }

  function selectSlot(slot: AvailableSlot) {
    setState((s) => ({ ...s, slot }));
  }

  function submitDetails(customer: CustomerDetailsInput) {
    setState((s) => ({ ...s, customer, acceptedPolicy: true }));
    goTo("summary");
  }

  async function confirmBooking() {
    if (!state.treatment || !state.slot || !state.customer) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: state.treatment.id,
          addonIds: state.selectedAddonIds,
          startAt: state.slot.slot_start,
          customer: state.customer,
          acceptedCancellationPolicy: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(SUBMIT_ERROR_MESSAGES[data.error] ?? data.message ?? "אירעה שגיאה. נא לנסות שוב.");
        if (data.error === "SLOT_TAKEN") goTo("time");
        return;
      }
      setConfirmedAppointment(data.appointment as Appointment);
      goTo("done");
    } catch {
      setSubmitError("בעיית תקשורת. נא לבדוק את החיבור ולנסות שוב.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "done" && confirmedAppointment) {
    return (
      <Container className="max-w-2xl py-14">
        <ConfirmationStep appointment={confirmedAppointment} />
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-10 sm:py-14">
      <div className="mb-8">
        <StepIndicator current={step} />
      </div>

      {step === "treatment" && (
        <TreatmentStep
          treatments={treatments}
          selectedId={state.treatment?.id ?? null}
          onSelect={selectTreatment}
          onNext={() => goTo("addons")}
        />
      )}

      {step === "addons" && state.treatment && (
        <AddonsStep
          addons={currentAddons}
          selectedIds={state.selectedAddonIds}
          onToggle={toggleAddon}
          onNext={() => goTo("date")}
          onBack={() => goTo("treatment")}
        />
      )}

      {step === "date" && state.treatment && (
        <DateStep
          serviceId={state.treatment.id}
          selectedDate={state.date}
          onSelect={selectDate}
          onNext={() => goTo("time")}
          onBack={() => goTo("addons")}
          horizonDays={bookingHorizonDays}
        />
      )}

      {step === "time" && state.treatment && state.date && (
        <TimeStep
          serviceId={state.treatment.id}
          date={state.date}
          selectedSlot={state.slot}
          onSelect={selectSlot}
          onNext={() => goTo("details")}
          onBack={() => goTo("date")}
        />
      )}

      {step === "details" && (
        <DetailsStep
          defaultValues={state.customer ? { ...state.customer, acceptedCancellationPolicy: state.acceptedPolicy } : null}
          cancellationPolicyText={cancellationPolicyText}
          onSubmit={submitDetails}
          onBack={() => goTo("time")}
        />
      )}

      {step === "summary" && (
        <SummaryStep
          state={state}
          addonsById={addonsById}
          onConfirm={confirmBooking}
          onBack={() => goTo("details")}
          onEditDetails={() => goTo("details")}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      )}
    </Container>
  );
}
