export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  specialty?: string | null;
  image_url?: string;
  image?: string;
}

export interface Doctor {
  id: number;
  full_name: string;
  specialty?: {
    id: number;
    name: string;
    description: string;
  } | null;
  email?: string;
  phone?: string;
  experience_years?: number;
  imageUrl?: string;
  image_url?: string;
  image?: string | null;
  work_schedules?: WorkScheduleDTO[];
}

export interface UserProfile {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string | null;
  gender?: 'M' | 'F' | null;
  address?: string;
  is_staff?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AppointmentEntry {
  id: number;
  appointment_datetime: string;
  status: string;
  notes?: string;
  doctor?: number;
  doctor_name?: string;
  doctor_specialty?: string;
  service?: number;
  service_name?: string;
  patient_name?: string;
  patient_phone?: string;
}

export type ToothStatus = 'healthy' | 'caries' | 'filling' | 'extracted' | 'crown' | 'implant' | 'other';

export interface Tooth {
  id: number;
  tooth_number: number;
  status: ToothStatus;
  notes?: string;
}

export interface TreatmentRecord {
  id: number;
  diagnosis: string;
  notes?: string;
  date: string;
  doctor?: number | null;
  services?: string;
  teeth?: string;
  cost?: number;
 receipt_url?: string | null;
}

export interface MedicalRecord {
  id: number;
  user: number;
  created_at: string;
  updated_at: string;
  treatments?: TreatmentRecord[];
  dental_chart?: Tooth[];
}

export interface AppointmentData {
  date: string;
  time?: string;
  doctor_id?: number;
  service_id?: number;
  notes?: string;
}

export interface AppointmentRequestEntry {
  id: number;
  name: string;
  phone: string;
  appointment_datetime: string;
  service_name_text?: string;
  doctor_name?: string;
  notes?: string;
  status: 'new' | 'in_progress' | 'approved' | 'rejected' | 'done';
  rejection_reason?: string;
  created_at?: string;
}

export interface Patient {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number: string;
  date_of_birth?: string | null;
  address?: string;
  date_joined?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface WorkScheduleDTO {
  id?: number;
  doctor: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  lunch_start?: string | null;
  lunch_end?: string | null;
}

export interface DentalChartUpdate {
  status: ToothStatus;
  notes?: string;
}

export interface CompleteAppointmentPayload {
  diagnosis: string;
  notes?: string;
  total_amount: number;
  performed_services: number[];
  treated_teeth: number[];
  dental_chart_updates: Record<number, DentalChartUpdate>;
  medical_record_notes?: string;
}

export interface StatisticsOverview {
  total_revenue: number;
  revenue_for_period: number;
  total_patients: number;
  new_patients: number;
  total_doctors: number;
  total_appointments: number;
}

export interface StatisticsData {
  overview: StatisticsOverview;
  revenue_by_month: { name: string; Прибуток: number }[];
  appointments_status: { name: string; value: number }[];
  top_services: { name: string; Кількість: number }[];
}

export interface Invoice {
  id: number;
  treatment_record: number;
  total_amount: string | number;
  status: 'unpaid' | 'paid' | 'cancelled';
  created_at: string;
  patient_name: string;
  patient_phone: string;
  receipt_pdf: string | null;
}