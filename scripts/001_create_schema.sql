-- Healthcare Application Database Schema

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctor profiles (additional info for doctors)
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  license_number TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  available_hours_start TIME DEFAULT '09:00',
  available_hours_end TIME DEFAULT '17:00',
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Medical records
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('diagnosis', 'prescription', 'lab_result', 'imaging', 'note')),
  title TEXT NOT NULL,
  description TEXT,
  diagnosis TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Prescription items (medicines)
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medicine reminders
CREATE TABLE IF NOT EXISTS public.medicine_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prescription_item_id UUID REFERENCES public.prescription_items(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  reminder_times TIME[] NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Medicine adherence logs
CREATE TABLE IF NOT EXISTS public.adherence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.medicine_reminders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Symptom analysis logs
CREATE TABLE IF NOT EXISTS public.symptom_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symptoms TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major')),
  analysis_result JSONB,
  recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Doctors can view patient profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'doctor')
);

-- RLS Policies for doctor_profiles
CREATE POLICY "Anyone can view doctor profiles" ON public.doctor_profiles FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own profile" ON public.doctor_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Doctors can insert their own profile" ON public.doctor_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for medical_records
CREATE POLICY "Patients can view their own records" ON public.medical_records FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view their patients records" ON public.medical_records FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can insert records" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update records they created" ON public.medical_records FOR UPDATE USING (auth.uid() = doctor_id);

-- RLS Policies for appointments
CREATE POLICY "Patients can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can update appointments" ON public.appointments FOR UPDATE USING (auth.uid() = doctor_id);
CREATE POLICY "Patients can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id);

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view their prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view prescriptions they created" ON public.prescriptions FOR SELECT USING (auth.uid() = doctor_id);
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors can update their prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = doctor_id);

-- RLS Policies for prescription_items
CREATE POLICY "Users can view prescription items for their prescriptions" ON public.prescription_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions 
    WHERE prescriptions.id = prescription_items.prescription_id 
    AND (prescriptions.patient_id = auth.uid() OR prescriptions.doctor_id = auth.uid())
  )
);
CREATE POLICY "Doctors can insert prescription items" ON public.prescription_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.prescriptions 
    WHERE prescriptions.id = prescription_items.prescription_id 
    AND prescriptions.doctor_id = auth.uid()
  )
);

-- RLS Policies for medicine_reminders
CREATE POLICY "Patients can view their reminders" ON public.medicine_reminders FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can create their reminders" ON public.medicine_reminders FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update their reminders" ON public.medicine_reminders FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Patients can delete their reminders" ON public.medicine_reminders FOR DELETE USING (auth.uid() = patient_id);

-- RLS Policies for adherence_logs
CREATE POLICY "Patients can view their adherence logs" ON public.adherence_logs FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can create adherence logs" ON public.adherence_logs FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update their adherence logs" ON public.adherence_logs FOR UPDATE USING (auth.uid() = patient_id);
CREATE POLICY "Doctors can view patient adherence" ON public.adherence_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE appointments.doctor_id = auth.uid() 
    AND appointments.patient_id = adherence_logs.patient_id
  )
);

-- RLS Policies for symptom_analyses
CREATE POLICY "Patients can view their symptom analyses" ON public.symptom_analyses FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can create symptom analyses" ON public.symptom_analyses FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Doctors can view patient symptom analyses" ON public.symptom_analyses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE appointments.doctor_id = auth.uid() 
    AND appointments.patient_id = symptom_analyses.patient_id
  )
);

-- Create trigger function for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- If user is a doctor, create doctor profile entry
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient') = 'doctor' THEN
    INSERT INTO public.doctor_profiles (id, specialization)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'specialization', 'General Practice')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicine_reminders_patient_id ON public.medicine_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_adherence_logs_patient_id ON public.adherence_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
