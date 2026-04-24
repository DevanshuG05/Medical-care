# Real-Time Appointment Booking System

**Date:** 2026-04-23
**Status:** Approved

## Overview

Fix the broken appointment section in MediCare+ so patients can browse doctors, book appointments, and receive live status updates — while doctors receive instant in-app notifications for new bookings and can confirm or decline in real time. Uses Supabase Realtime (postgres_changes) on the existing `appointments` table with no new database tables required.

## Bug Fixes

### 1. Empty doctor list
`app/patient/appointments/page.tsx` fetches doctors with `.eq('is_verified', true)`. Any doctor without that flag set returns zero results. Remove this filter so all rows in `doctor_profiles` appear in the booking dialog.

## Architecture

Two client components subscribe to Supabase Realtime channels after their initial data fetch. Each channel uses a `postgres_changes` listener scoped to the `appointments` table with a row-level filter so each user only receives events relevant to them. Channels are removed on component unmount.

No new API routes, no new database tables.

## Doctor Dashboard — Realtime (INSERT)

**File:** `app/doctor/appointments/page.tsx`

After the initial fetch and once `doctorProfile.id` is known, open a channel:

```
supabase
  .channel('doctor-appointments-<doctorId>')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'appointments',
    filter: `doctor_id=eq.<doctorId>`
  }, handler)
  .subscribe()
```

**Handler behaviour:**
- Prepend the new appointment to `appointments` state (it appears in the Pending tab immediately).
- Show a `sonner` toast: `"New appointment request from <patient name>"`.
- Patient name comes from a follow-up query: `profiles` where `id = payload.new.patient_id`.

**Cleanup:** `supabase.removeChannel(channel)` in the `useEffect` return.

## Patient Dashboard — Realtime (UPDATE)

**File:** `app/patient/appointments/page.tsx`

After the initial fetch and once `user.id` is known, open a channel:

```
supabase
  .channel('patient-appointments-<userId>')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'appointments',
    filter: `patient_id=eq.<userId>`
  }, handler)
  .subscribe()
```

**Handler behaviour:**
- Find the matching appointment in state by `id` and replace its `status` field.
- Show a `sonner` toast:
  - `confirmed` → `"Your appointment has been confirmed"`
  - `cancelled` → `"Your appointment was declined"`

**Cleanup:** `supabase.removeChannel(channel)` in the `useEffect` return.

## Double-Booking Prevention

When the patient selects a doctor and a date in the booking dialog, fetch all `pending` and `confirmed` appointments for that doctor on that date:

```
supabase
  .from('appointments')
  .select('appointment_time')
  .eq('doctor_id', selectedDoctor)
  .eq('appointment_date', selectedDate)
  .in('status', ['pending', 'confirmed'])
```

The returned time values are placed in a `bookedSlots` set. In `getAvailableTimeSlots()`, any slot present in `bookedSlots` is filtered out. This runs whenever `selectedDoctor` or `selectedDate` changes.

## Data Flow

```
Patient books appointment
  → INSERT into appointments (status: pending)
    → Doctor Realtime channel fires INSERT event
      → Doctor's Pending tab updates + toast shown
        → Doctor clicks Confirm/Decline
          → UPDATE appointments (status: confirmed | cancelled)
            → Patient Realtime channel fires UPDATE event
              → Patient's appointment badge updates + toast shown
```

## Error Handling

- If the Realtime channel fails to subscribe, the page still works via the initial fetch — users just won't get live updates until they refresh. No error UI needed; Supabase handles reconnection automatically.
- If the booked-slots fetch fails, fall back to showing all slots (same behaviour as today).

## Files Changed

| File | Change |
|------|--------|
| `app/patient/appointments/page.tsx` | Remove `is_verified` filter; add Realtime UPDATE subscription; add booked-slot filtering |
| `app/doctor/appointments/page.tsx` | Add Realtime INSERT subscription with patient name toast |
