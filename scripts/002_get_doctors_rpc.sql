-- Returns a patient's prescriptions with doctor name and medicine items.
-- SECURITY DEFINER bypasses RLS so the patient can read doctor names.
CREATE OR REPLACE FUNCTION public.get_patient_prescriptions(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  doctor_name TEXT,
  items JSONB
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pr.id,
    pr.diagnosis,
    pr.notes,
    pr.created_at,
    p.full_name AS doctor_name,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', pi.id,
          'medicine_name', pi.medicine_name,
          'dosage', pi.dosage,
          'frequency', pi.frequency,
          'duration', pi.duration,
          'instructions', pi.instructions
        ))
        FROM public.prescription_items pi
        WHERE pi.prescription_id = pr.id
      ),
      '[]'::jsonb
    ) AS items
  FROM public.prescriptions pr
  JOIN public.profiles p ON p.id = pr.doctor_id
  WHERE pr.patient_id = p_patient_id
  ORDER BY pr.created_at DESC;
$$;

-- Returns unique patients for a doctor (from their appointments).
-- SECURITY DEFINER bypasses RLS so the doctor can read patient names.
CREATE OR REPLACE FUNCTION public.get_doctor_patients(p_doctor_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    p.id,
    p.full_name
  FROM public.appointments a
  JOIN public.profiles p ON p.id = a.patient_id
  WHERE a.doctor_id = p_doctor_id
  ORDER BY p.full_name;
$$;

-- Returns all doctors with profile info for the patient booking dialog.
-- SECURITY DEFINER bypasses RLS on profiles so patients can see doctor names.
CREATE OR REPLACE FUNCTION public.get_available_doctors()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  specialization TEXT,
  consultation_fee DECIMAL,
  available_days TEXT[],
  available_hours_start TIME,
  available_hours_end TIME
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dp.id,
    p.full_name,
    dp.specialization,
    dp.consultation_fee,
    dp.available_days,
    dp.available_hours_start,
    dp.available_hours_end
  FROM public.doctor_profiles dp
  JOIN public.profiles p ON p.id = dp.id;
$$;

-- Returns a doctor's appointments with patient name and phone.
-- SECURITY DEFINER bypasses RLS on profiles so the patient's info is readable.
CREATE OR REPLACE FUNCTION public.get_doctor_appointments(p_doctor_id UUID)
RETURNS TABLE (
  id UUID,
  appointment_date DATE,
  appointment_time TIME,
  status TEXT,
  reason TEXT,
  patient_name TEXT,
  patient_phone TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.reason,
    p.full_name AS patient_name,
    p.phone     AS patient_phone
  FROM public.appointments a
  JOIN public.profiles p ON p.id = a.patient_id
  WHERE a.doctor_id = p_doctor_id
  ORDER BY a.appointment_date DESC;
$$;

-- Returns a patient's appointments with doctor name and specialization.
-- SECURITY DEFINER bypasses RLS on profiles so the doctor's name is readable.
CREATE OR REPLACE FUNCTION public.get_patient_appointments(p_patient_id UUID)
RETURNS TABLE (
  id UUID,
  appointment_date DATE,
  appointment_time TIME,
  status TEXT,
  reason TEXT,
  doctor_name TEXT,
  doctor_specialization TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.reason,
    p.full_name  AS doctor_name,
    dp.specialization AS doctor_specialization
  FROM public.appointments a
  JOIN public.profiles p  ON p.id  = a.doctor_id
  LEFT JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
  WHERE a.patient_id = p_patient_id
  ORDER BY a.appointment_date DESC;
$$;
