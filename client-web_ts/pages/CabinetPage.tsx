import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppointmentEntry, MedicalRecord, UserProfile, Doctor, ServiceItem } from '../types';
import {
  fetchAppointments, fetchMedicalRecord,
  fetchUserProfile, fetchDoctors, fetchServices,
  logoutUser
} from '../services/api';
import { DentalChart } from '../components/DentalChart';
import { User, FileText, CalendarPlus, ChevronRight, ChevronLeft, Settings, Download } from 'lucide-react';

import { AppointmentsPage } from './AppointmentsPage';
import { SettingsPage } from './SettingsPage';

const TOKEN_KEY = 'dental_clinic_tokens';

const CabinetPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'new_appointment' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleLogout = async () => {
    try {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved && token) {
        const parsed = JSON.parse(saved);
        await logoutUser(parsed.refresh, token);
      }
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      navigate('/');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      try {
        setToken(JSON.parse(saved).access);
      } catch (e) {
        console.error('Token parse error', e);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchUserProfile(token);

        if (profile.is_staff) {
          navigate('/admin');
          return;
        }

        const [mr, appts, docs, servs] = await Promise.all([
          fetchMedicalRecord(token),
          fetchAppointments(token),
          fetchDoctors(),
          fetchServices(),
        ]);

        setUserProfile(profile);
        setMedicalRecord(mr);
        setAppointments(appts);
        setDoctors(docs);
        setServices(servs);
      } catch (err: any) {
        setError('Не вдалося завантажити дані кабінету.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, navigate]);

  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab !== 'medical') setCurrentPage(1);
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dental-400 to-dental-600 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
            {userProfile?.first_name ? userProfile.first_name.charAt(0) : 'П'}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Вітаємо, {userProfile?.first_name || 'Пацієнт'} {userProfile?.last_name || ''}!
            </h2>
            <p className="text-gray-500 font-medium">{userProfile?.phone || userProfile?.username}</p>
            {userProfile?.email && <p className="text-gray-500 text-sm mt-1">{userProfile.email}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" onClick={() => changeTab('medical')}>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><FileText /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Медична картка</h3>
          <p className="text-sm text-gray-600 flex-grow">Перегляньте свою зубну формулу та історію лікувань.</p>
          <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm mt-auto">Відкрити <ChevronRight size={16} /></div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" onClick={() => changeTab('new_appointment')}>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4"><CalendarPlus /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Записи на прийом</h3>
          <p className="text-sm text-gray-600 flex-grow">Переглядайте актуальні візити та записуйтесь до лікаря.</p>
          <div className="mt-4 flex items-center gap-2 text-teal-600 font-bold text-sm mt-auto">Перейти <ChevronRight size={16} /></div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" onClick={() => changeTab('settings')}>
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Settings /></div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Налаштування</h3>
          <p className="text-sm text-gray-600 flex-grow">Керуйте особистими даними та змінюйте пароль безпеки.</p>
          <div className="mt-4 flex items-center gap-2 text-orange-600 font-bold text-sm mt-auto">Налаштувати <ChevronRight size={16} /></div>
        </div>
      </div>
    </div>
  );

  const renderMedicalRecord = () => {
    if (!medicalRecord) {
      return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">📋</div>
          <h3 className="text-lg font-bold text-gray-900">Медична картка відсутня</h3>
          <p className="text-gray-500 mt-2">Адміністратор або лікар ще не створив вашу картку.</p>
        </div>
      );
    }

    const sortedTreatments = medicalRecord.treatments
      ? [...medicalRecord.treatments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

    const totalPages = Math.ceil(sortedTreatments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTreatments = sortedTreatments.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div className="space-y-8 animate-in fade-in duration-300 max-w-full">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm overflow-hidden w-full max-w-full">
          <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ваша Медична Картка</h2>
              <p className="text-sm text-gray-500 mt-1">Оновлено: {new Date(medicalRecord.updated_at).toLocaleString('uk-UA')}</p>
            </div>
            <span className="px-4 py-2 rounded-xl bg-dental-50 text-dental-700 font-bold text-sm border border-dental-100">
              ID: #{medicalRecord.id}
            </span>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">🦷</span>
              Зубна Формула
            </h3>
            <div className="w-full px-2">
              <DentalChart teeth={medicalRecord.dental_chart || []} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm w-full max-w-full overflow-hidden">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-8">
            <span className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl">📜</span>
            Історія Лікування
          </h3>
          <div className="relative">
            {sortedTreatments.length > 0 ? (
              <div className="flex flex-col">
                <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
                  {currentTreatments.map((t) => (
                    <div key={t.id} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="absolute -left-[10px] top-1.5 w-5 h-5 rounded-full bg-white border-4 border-dental-500 shadow-sm"></div>
                      <div onClick={() => setSelectedTreatment(t)} className="p-6 rounded-2xl transition-all cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-dental-300 group">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-dental-700 bg-dental-50 px-3 py-1.5 rounded-lg border border-dental-100">
                              {new Date(t.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            {t.receipt_url && (
                              <span className="flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100" title="Доступний електронний чек">
                                <Download size={14} /> Чек
                              </span>
                            )}
                          </div>
                          {t.teeth && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                              🦷 Зуби: {t.teeth}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-900 font-bold text-xl group-hover:text-dental-700 transition-colors mb-2">{t.diagnosis}</p>
                        {t.services && <p className="text-sm text-gray-500 font-medium mb-3 truncate">{t.services}</p>}
                        <div className="mt-4 flex items-center justify-end">
                          <span className="text-sm font-bold text-dental-600 bg-white px-4 py-1.5 rounded-xl border border-dental-200 opacity-0 group-hover:opacity-100 transition-opacity">Детальніше →</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-dental-600 bg-dental-50 hover:bg-dental-100 border border-dental-100'}`}
                    >
                      <ChevronLeft size={18} /> Новіші
                    </button>

                    <span className="text-sm font-bold text-gray-500">
                      Сторінка {currentPage} з {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-dental-600 bg-dental-50 hover:bg-dental-100 border border-dental-100'}`}
                    >
                      Старіші <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-bold text-lg mb-1">Історія лікування порожня</p>
                <p className="text-sm text-gray-400">Тут з'являться ваші візити після прийому лікаря.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) return <div className="flex flex-col items-center py-20"><div className="w-12 h-12 border-4 border-dental-100 border-t-dental-600 rounded-full animate-spin mb-4"></div></div>;
    if (activeTab === 'overview') return renderOverview();
    if (activeTab === 'medical') return renderMedicalRecord();

    if (activeTab === 'new_appointment') {
      return (
        <AppointmentsPage
          token={token!}
          appointments={appointments}
          doctors={doctors}
          services={services}
          onRefresh={async () => {
            const freshAppts = await fetchAppointments(token!);
            setAppointments(freshAppts);
          }}
        />
      );
    }

    if (activeTab === 'settings') {
      return (
        <SettingsPage
          token={token!}
          initialProfile={userProfile}
          onProfileUpdated={setUserProfile}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">

      {selectedTreatment && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 my-auto">
            <button onClick={() => setSelectedTreatment(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-dental-50 text-dental-600 rounded-xl flex items-center justify-center text-xl">🦷</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Деталі візиту</h2>
                <p className="text-sm font-medium text-gray-500">{new Date(selectedTreatment.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Основний діагноз</h4>
                <p className="text-lg font-bold text-dental-800 bg-dental-50/50 border border-dental-100 p-4 rounded-xl">{selectedTreatment.diagnosis}</p>
              </div>

              {selectedTreatment.doctor && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Лікуючий лікар</h4>
                  <div className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-gradient-to-br from-dental-400 to-dental-600 rounded-full flex items-center justify-center text-white font-bold">
                      {doctors.find(d => d.id === selectedTreatment.doctor)?.full_name.charAt(0) || 'Л'}
                    </div>
                    <p className="text-gray-800 font-bold">
                      {doctors.find(d => d.id === selectedTreatment.doctor)?.full_name || 'Невідомий лікар'}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedTreatment.services && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Послуги</h4>
                    <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedTreatment.services}</p>
                  </div>
                )}
                {selectedTreatment.teeth && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Задіяні зуби</h4>
                    <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedTreatment.teeth}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Загальна вартість та оплата</h4>
                <div className="flex items-center justify-between bg-white border-2 border-dental-100 p-4 rounded-xl shadow-sm">
                  <span className="text-2xl font-black text-dental-600">
                    {selectedTreatment.cost ? `${selectedTreatment.cost} ₴` : "0 ₴"}
                  </span>

                  {selectedTreatment.receipt_url && (
                    <a
                      href={selectedTreatment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-dental-50 text-dental-700 font-bold rounded-lg hover:bg-dental-100 transition-colors border border-dental-200"
                    >
                      <Download size={18} />
                      Завантажити чек
                    </a>
                  )}
                </div>
              </div>

              {selectedTreatment.notes && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Медичні нотатки</h4>
                  <p className="text-gray-700 bg-amber-50/30 border border-amber-100/50 p-5 rounded-xl leading-relaxed whitespace-pre-wrap shadow-inner">
                    {selectedTreatment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setSelectedTreatment(null)} className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors shadow-lg">
                Зрозуміло, закрити
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm shrink-0 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-dental-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"><span className="text-xl font-bold">D</span></div>
            <span className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">Dental Clinic</span>
            <span className="ml-3 pl-3 border-l-2 border-gray-200 text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-widest hidden sm:block">Кабінет Пацієнта</span>
          </Link>
          <div className="flex items-center gap-3">
            {token ? (
              <button onClick={handleLogout} className="px-5 py-2.5 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold shadow-sm">Вийти з системи</button>
            ) : (
              <Link to="/login" className="px-5 py-2.5 rounded-full bg-dental-600 text-white hover:bg-dental-700 text-sm font-semibold shadow-sm">Увійти</Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm mb-6">{error}</div>}

        {!token ? (
          <div className="bg-white border border-dashed border-dental-200 rounded-2xl p-6 text-center">
            <p className="text-gray-700 mb-3">Щоб переглянути медичну картку та записи, увійдіть у систему.</p>
            <Link to="/login" className="px-5 py-3 bg-dental-600 text-white rounded-xl font-semibold hover:bg-dental-700 inline-block">Перейти до входу</Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <aside className="w-full lg:w-64 flex-shrink-0 sticky top-8 z-20">
              <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
                <div className="px-4 pb-4 mb-4 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Меню кабінету</h3></div>
                <nav className="flex flex-col gap-2">
                  <button onClick={() => changeTab('overview')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'overview' ? 'bg-dental-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><User size={20} />Огляд</button>
                  <button onClick={() => changeTab('medical')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'medical' ? 'bg-dental-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}><FileText size={20} />Медична картка</button>
                  <button onClick={() => changeTab('new_appointment')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'new_appointment' ? 'bg-dental-600 text-white shadow-md ring-2 ring-dental-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}><CalendarPlus size={20} />Записи</button>
                  <div className="my-2 border-t border-gray-100"></div>
                  <button onClick={() => changeTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'settings' ? 'bg-dental-600 text-white shadow-md ring-2 ring-dental-100' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}><Settings size={20} />Налаштування</button>
                </nav>
              </div>
            </aside>

            <div className="flex-1 w-full min-w-0 max-w-full">
              {renderTabContent()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CabinetPage;