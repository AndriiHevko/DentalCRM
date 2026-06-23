import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { UserProfile, Patient, AppointmentEntry, Doctor, ServiceItem, Invoice, StatisticsData } from '../../types';
import { fetchPatients, fetchAllAppointments, fetchDoctors, fetchServices, fetchAllInvoices, fetchStatistics } from '../../services/api';
import { Users, Calendar, Activity, Stethoscope, Banknote } from 'lucide-react';

interface AdminContext {
  token: string;
  userProfile: UserProfile;
}

const AdminDashboardPage: React.FC = () => {
  const { token, userProfile } = useOutletContext<AdminContext>();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [statsOverview, setStatsOverview] = useState<StatisticsData['overview'] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [patientsData, apptsData, doctorsData, servicesData, invoicesData, statsData] = await Promise.all([
          fetchPatients(token),
          fetchAllAppointments(token, 1),
          fetchDoctors(),
          fetchServices(),
          fetchAllInvoices(token),
          fetchStatistics(token, 'all_time')
        ]);

        if (apptsData && apptsData.results) {
          setAppointments(apptsData.results);
        } else {
          const fallbackAppts = Array.isArray(apptsData) ? apptsData : [];
          setAppointments(fallbackAppts);
        }

        setPatients(patientsData);
        setDoctors(doctorsData);
        setServices(servicesData);
        setInvoices(invoicesData);
        
        if (statsData && statsData.overview) {
            setStatsOverview(statsData.overview);
        }

      } catch (err: any) {
        console.error('Failed to load admin stats', err);
        setError('Не вдалося завантажити статистику. Перевірте підключення до сервера.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalPatients = statsOverview?.total_patients || patients.length;
  const totalDoctors = statsOverview?.total_doctors || doctors.length;
  const totalAppointmentsCount = statsOverview?.total_appointments || 0;
  const totalInvoicesAmount = statsOverview?.total_revenue || 0;

  const newPatientsThisMonth = patients.filter(p => {
    if (!p.created_at) return false;
    const joinDate = new Date(p.created_at);
    const now = new Date();
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
  }).length;

  const pendingAppointments = appointments.filter(a => a.status === 'new' || a.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Головна панель</h1>
        <p className="text-gray-500 mt-1">Огляд статистики клініки та активності.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

        {/* Дохід */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Banknote size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Дохід</p>
            <p className="text-2xl font-black text-gray-900">{totalInvoicesAmount.toLocaleString('uk-UA')} ₴</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{invoices.length} чеків</p>
          </div>
        </div>

        {/* Пацієнти */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Пацієнти</p>
            <p className="text-2xl font-black text-gray-900">{totalPatients}</p>
            <p className="text-xs text-green-600 font-medium mt-1">+{newPatientsThisMonth} поточного міс.</p>
          </div>
        </div>

        {/* Записи */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Записи</p>
            {/* Використовуємо реальну загальну кількість з бекенду */}
            <p className="text-2xl font-black text-gray-900">{totalAppointmentsCount}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">{pendingAppointments} нових очікують</p>
          </div>
        </div>

        {/* Лікарі */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Stethoscope size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Лікарі</p>
            <p className="text-2xl font-black text-gray-900">{totalDoctors}</p>
            <p className="text-xs text-purple-600 font-medium mt-1">Персонал клініки</p>
          </div>
        </div>

        {/* Статус системи */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Система</p>
            <p className="text-2xl font-black text-gray-900">Активна</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Оновлено щойно</p>
          </div>
        </div>

      </div>

      {/* Швидкі дії */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Швидкі дії</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

          <div
            onClick={() => navigate('/admin/invoices')}
            className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-dental-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <p className="font-bold text-gray-900 group-hover:text-dental-600 text-lg mb-1">Фінанси та чеки</p>
            <p className="text-sm text-gray-500">Переглянути згенеровані квитанції</p>
          </div>

          <div
            onClick={() => navigate('/admin/doctors')}
            className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-dental-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <p className="font-bold text-gray-900 group-hover:text-dental-600 text-lg mb-1">Керувати лікарями</p>
            <p className="text-sm text-gray-500">Додати лікаря, змінити графік</p>
          </div>

          <div
            onClick={() => navigate('/admin/patients?add=true')}
            className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-dental-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <p className="font-bold text-gray-900 group-hover:text-dental-600 text-lg mb-1">Новий пацієнт</p>
            <p className="text-sm text-gray-500">Створити медичну картку</p>
          </div>

          <div
            onClick={() => navigate('/admin/appointments')}
            className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-dental-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <p className="font-bold text-gray-900 group-hover:text-dental-600 text-lg mb-1">Усі записи</p>
            <p className="text-sm text-gray-500">Переглянути нові заявки</p>
          </div>

          <div
            onClick={() => navigate('/admin/services')}
            className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-dental-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <p className="font-bold text-gray-900 group-hover:text-dental-600 text-lg mb-1">Прайс та послуги</p>
            <p className="text-sm text-gray-500">Додати або змінити ціни</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;