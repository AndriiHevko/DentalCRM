import {
  AppointmentData,
  Doctor,
  ServiceItem,
  AppointmentEntry,
  MedicalRecord,
  UserProfile,
  AppointmentRequestEntry,
  Patient,
  WorkScheduleDTO,
  Tooth,
  DentalChartUpdate,
  StatisticsData,
  Invoice
} from '../types';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'dental_clinic_tokens';

// Доп. функції для обробки відповідей та помилок

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

const unwrapList = <T>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray(payload.results)) return payload.results as T[];
  return [];
};

// Оновлення токена

const refreshAuthToken = async (refresh: string): Promise<string | null> => {
  try {
    const res = await fetch(`${API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access;
  } catch {
    return null;
  }
};

const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const tokenString = localStorage.getItem(TOKEN_KEY);
  const tokenData = tokenString ? JSON.parse(tokenString) : {};

  const isFormData = options.body instanceof FormData;

  let headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (tokenData.access) {
    headers['Authorization'] = `Bearer ${tokenData.access}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && tokenData.refresh) {
    const newAccess = await refreshAuthToken(tokenData.refresh);

    if (newAccess) {
      tokenData.access = newAccess;
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));

      let retryHeaders: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
        'Authorization': `Bearer ${newAccess}`,
      };
      if (!isFormData) {
        retryHeaders['Content-Type'] = 'application/json';
      }
      res = await fetch(url, { ...options, headers: retryHeaders });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
  } else if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  }

  return res;
};

// Публічні API

export const fetchServices = async (): Promise<ServiceItem[]> => {
  const res = await fetch(`${API_URL}/services/`);
  const data = await handleResponse<any>(res);
  return unwrapList<ServiceItem>(data).map((s) => ({
    ...s,
    price: typeof s.price === 'string' ? Number(s.price) : s.price,
  }));
};

export const fetchDoctors = async (): Promise<Doctor[]> => {
  const res = await fetch(`${API_URL}/doctors/`);
  const data = await handleResponse<any>(res);
  return unwrapList<Doctor>(data);
};

export const fetchDoctorAvailability = async (doctorId: number, date: string, serviceId: number): Promise<string[]> => {
  const res = await fetch(`${API_URL}/doctors/${doctorId}/availability/?date=${date}&service_id=${serviceId}`);
  const data = await handleResponse<any>(res);
  return data.available_slots || [];
};

export const loginUser = async (username: string, password: string): Promise<{ access: string; refresh: string }> => {
  const res = await fetch(`${API_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await res.text() || 'Auth error');
  return res.json();
};

export const registerUser = async (userData: any): Promise<void> => {
  const res = await fetch(`${API_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const text = await res.text();
    let errMessage = 'Registration error';
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        const errors = Object.entries(parsed)
          .map(([k, v]) => {
            const field = k === 'non_field_errors' ? '' : `[${k}] `;
            const val = Array.isArray(v) ? v.join(' ') : String(v);
            return `${field}${val}`;
          })
          .join(' | ');
        if (errors) errMessage = errors;
      }
    } catch {
      if (text) errMessage = text;
    }
    throw new Error(errMessage);
  }
};

export const verifyEmail = async (email: string, code: string): Promise<any> => {
  const res = await fetch(`${API_URL}/verify-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    let errMessage = 'Невірний код підтвердження. Спробуйте ще раз.';
    try {
      const parsed = await res.json();
      // Обробка стандартних відповідей DRF про помилки
      if (parsed.detail) {
        errMessage = parsed.detail;
      } else if (parsed.code) {
        errMessage = parsed.code[0];
      } else if (parsed.non_field_errors) {
        errMessage = parsed.non_field_errors[0];
      }
    } catch {    }
    throw new Error(errMessage);
  }

  return res.json();
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let errMessage = 'Не вдалося відправити запит. Перевірте email.';
    try {
      const parsed = await res.json();
      if (parsed.detail) errMessage = parsed.detail;
      else if (parsed.email) errMessage = parsed.email[0];
    } catch { }
    throw new Error(errMessage);
  }
};

export const confirmPasswordReset = async (data: { uidb64: string, token: string, new_password: string }): Promise<void> => {
  const res = await fetch(`${API_URL}/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let errMessage = 'Не вдалося змінити пароль. Посилання недійсне.';
    try {
      const parsed = await res.json();
      if (parsed.detail) errMessage = parsed.detail;
      else if (parsed.new_password) errMessage = parsed.new_password[0];
    } catch { }
    throw new Error(errMessage);
  }
};


// Захищені API

export const fetchMedicalRecord = async (token: string): Promise<MedicalRecord | null> => {
  const res = await authenticatedFetch(`${API_URL}/medical-records/`);
  const data = await handleResponse<any>(res);
  const list = unwrapList<MedicalRecord>(data);
  return list[0] || null;
};

export const fetchAppointments = async (token: string): Promise<AppointmentEntry[]> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/`);
  const data = await handleResponse<any>(res);
  return unwrapList<AppointmentEntry>(data);
};

export const fetchAllInvoices = async (token: string): Promise<Invoice[]> => {
  const res = await authenticatedFetch(`${API_URL}/invoices/`);
  const data = await handleResponse<any>(res);
  return unwrapList<Invoice>(data);
};

export const updateAppointmentStatus = async (
  id: number,
  statusValue: string,
  token: string
): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: statusValue }),
  });
  if (!res.ok) throw new Error(await res.text() || 'Status update error');
};

export const cancelAppointment = async (id: number, token: string): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let errorMessage = 'Не вдалося скасувати запис. Спробуйте пізніше.';

    try {
      const parsed = JSON.parse(errText);
      if (parsed.status) {
        errorMessage = Array.isArray(parsed.status) ? parsed.status[0] : parsed.status;
      } else if (parsed.non_field_errors) {
        errorMessage = parsed.non_field_errors[0];
      } else if (parsed.detail) {
        errorMessage = parsed.detail;
      } else if (Array.isArray(parsed)) {
        errorMessage = parsed[0];
      }
    } catch {
      if (errText) errorMessage = errText;
    }

    throw new Error(errorMessage);
  }
};

export const updateAppointment = async (
  id: number,
  token: string,
  data: Partial<AppointmentEntry>
): Promise<AppointmentEntry> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка оновлення запису');
  }
  return res.json();
};

export const updateUserProfile = async (token: string, data: Partial<UserProfile>): Promise<UserProfile> => {
  const res = await authenticatedFetch(`${API_URL}/profile/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Profile update failed');
  }
  return handleResponse<UserProfile>(res);
};

export const changePassword = async (token: string, data: any): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/password-change/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    let errMessage = 'Не вдалося змінити пароль';
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.old_password) errMessage = parsed.old_password[0];
        else if (parsed.new_password) errMessage = parsed.new_password[0];
        else if (parsed.detail) errMessage = parsed.detail;
      }
    } catch { }
    throw new Error(errMessage);
  }
};

export const fetchUserProfile = async (token: string): Promise<UserProfile> => {
  const res = await authenticatedFetch(`${API_URL}/profile/`);
  const data = await handleResponse<any>(res);
  return data;
};

export const createAppointment = async (appointmentData: {
  doctor: number;
  service: number;
  appointment_datetime: string;
  notes?: string;
  patient?: number;
  status?: string;
}, token: string): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/`, {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
  await handleResponse(res);
};

export const logoutUser = async (refreshToken: string, token: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
  } catch (error) {
    console.error('Помилка при відправці запиту на вихід', error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const fetchPatients = async (token: string, search: string = ''): Promise<Patient[]> => {
  const url = search ? `${API_URL}/patients/?search=${encodeURIComponent(search)}` : `${API_URL}/patients/`;
  const res = await authenticatedFetch(url);
  const data = await handleResponse<any>(res);
  return unwrapList<Patient>(data);
};

export const fetchAllAppointments = async (
  token: string,
  page: number = 1
): Promise<{ count: number; results: AppointmentEntry[] }> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/?page=${page}`);
  const data = await handleResponse<any>(res);

  if (data && Array.isArray(data.results)) {
    return {
      count: data.count || 0,
      results: data.results,
    };
  }

  const list = unwrapList<AppointmentEntry>(data);
  return {
    count: list.length,
    results: list,
  };
};

export const createPatient = async (token: string, patientData: Partial<Patient>): Promise<Patient> => {
  const res = await authenticatedFetch(`${API_URL}/patients/`, {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка створення пацієнта');
  }
  return res.json();
};

export const updatePatient = async (id: number, token: string, patientData: Partial<Patient>): Promise<Patient> => {
  const res = await authenticatedFetch(`${API_URL}/patients/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patientData),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка оновлення пацієнта');
  }
  return res.json();
};

export const deletePatient = async (id: number, token: string): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/patients/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка видалення пацієнта');
  }
};

export const completeAppointment = async (id: number, token: string, completeData: any): Promise<any> => {
  const res = await authenticatedFetch(`${API_URL}/appointments/${id}/complete/`, {
    method: 'POST',
    body: JSON.stringify(completeData),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка завершення прийому');
  }
  return res.json();
};

// Управління лікарями та графіками 

export const fetchSpecialties = async (): Promise<any[]> => {
  const res = await authenticatedFetch(`${API_URL}/specialties/`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const createDoctor = async (token: string, data: any): Promise<Doctor> => {
  const isFormData = data instanceof FormData;
  const res = await authenticatedFetch(`${API_URL}/doctors/`, {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text() || 'Помилка створення лікаря');
  return res.json();
};

export const updateDoctor = async (id: number, token: string, data: any): Promise<Doctor> => {
  const isFormData = data instanceof FormData;
  const res = await authenticatedFetch(`${API_URL}/doctors/${id}/`, {
    method: 'PATCH',
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text() || 'Помилка оновлення лікаря');
  return res.json();
};

export const deleteDoctor = async (id: number, token: string): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/doctors/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка видалення лікаря');
  }
};

export const saveWorkSchedule = async (token: string, data: WorkScheduleDTO): Promise<void> => {
  const url = data.id ? `${API_URL}/work-schedules/${data.id}/` : `${API_URL}/work-schedules/`;
  const method = data.id ? 'PATCH' : 'POST';
  const res = await authenticatedFetch(url, {
    method,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Помилка збереження графіка');
};

export const deleteWorkSchedule = async (token: string, id: number): Promise<void> => {
  await authenticatedFetch(`${API_URL}/work-schedules/${id}/`, { method: 'DELETE' });
};

export const fetchPatientDentalChart = async (id: number, token: string): Promise<Tooth[]> => {
  const res = await authenticatedFetch(`${API_URL}/medical-records/patient/${id}/dental-chart/`);
  const data = await handleResponse<any>(res);
  return unwrapList<Tooth>(data);
};

export const updatePatientToothStatus = async (
  id: number,
  updateData: { tooth_number: number; status: string; notes?: string },
  token: string,
  isUpdate: boolean
): Promise<Tooth> => {

  const payload = {
    teeth: [updateData]
  };

  const res = await authenticatedFetch(`${API_URL}/medical-records/patient/${id}/dental-chart/`, {
    method: isUpdate ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка оновлення статусу зуба');
  }

  const responseData = await res.json();

  if (responseData.teeth && Array.isArray(responseData.teeth)) {
    return responseData.teeth.find((t: any) => t.tooth_number === updateData.tooth_number) || responseData.teeth[0];
  }
  if (Array.isArray(responseData)) {
    return responseData.find((t: any) => t.tooth_number === updateData.tooth_number) || responseData[0];
  }

  return responseData;
};

// Аналітика та статистика
export const fetchStatistics = async (token: string, period: string = 'monthly'): Promise<StatisticsData> => {
  const res = await authenticatedFetch(`${API_URL}/statistics/?period=${period}`);
  if (!res.ok) throw new Error(await res.text() || 'Помилка завантаження статистики');
  return res.json();
};

export const exportStatisticsPDF = async (token: string, period: string = 'monthly'): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/statistics/export/pdf/?period=${period}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Помилка завантаження PDF-звіту');
  }

  const blob = await res.blob();

  let filename = `report_${period}.pdf`;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Управління послугами

export const createService = async (token: string, data: any): Promise<ServiceItem> => {
  const isFormData = data instanceof FormData;
  const res = await authenticatedFetch(`${API_URL}/services/`, {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text() || 'Помилка створення послуги');
  return res.json();
};

export const updateService = async (id: number, token: string, data: any): Promise<ServiceItem> => {
  const isFormData = data instanceof FormData;
  const res = await authenticatedFetch(`${API_URL}/services/${id}/`, {
    method: 'PATCH',
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text() || 'Помилка оновлення послуги');
  return res.json();
};

export const deleteService = async (id: number, token: string): Promise<void> => {
  const res = await authenticatedFetch(`${API_URL}/services/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Помилка видалення послуги');
  }
};