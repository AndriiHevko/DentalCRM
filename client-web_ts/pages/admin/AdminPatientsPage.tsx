import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Patient, UserProfile } from '../../types';
import { fetchPatients, createPatient, updatePatient, deletePatient } from '../../services/api';
import { Search, User, Mail, Phone, Calendar, Plus, X, Edit, Save, Trash2 } from 'lucide-react';
import AdminDentalChart from '../../components/admin/AdminDentalChart';

interface AdminContext {
  token: string;
  userProfile: UserProfile;
}

const AdminPatientsPage: React.FC = () => {
  const { token } = useOutletContext<AdminContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('add') === 'true');
  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', phone_number: '', date_of_birth: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'info' | 'chart'>('info');
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Стан підтвердження видалення
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Функція видалення
  const handleDelete = async () => {
    if (!patientToDelete) return;

    setIsDeleting(true);
    try {
      await deletePatient(patientToDelete.id, token);
      setPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
      setPatientToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Помилка при видаленні пацієнта');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        const data = await fetchPatients(token, debouncedSearch);
        setPatients(data);
      } catch (err) {
        console.error('Failed to load patients', err);
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, [token, debouncedSearch]);

  const validatePatientForm = (data: any) => {
    if (!data.first_name?.trim()) return "Ім'я є обов'язковим";
    if (!data.last_name?.trim()) return "Прізвище є обов'язковим";

    const phoneRegex = /^\+380\d{9}$/;
    const phoneToTest = data.phone_number || '';
    if (!phoneRegex.test(phoneToTest.trim())) {
      return "Телефон має бути у форматі +380XXXXXXXXX";
    }

    if (data.date_of_birth) {
      const dob = new Date(data.date_of_birth);
      const minDate = new Date('1900-01-01');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dob < minDate) {
        return "Дата народження не може бути раніше 01.01.1900";
      }
      if (dob >= today) {
        return "Дата народження має бути в минулому часі";
      }
    }
    return null;
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSearchParams({});
    setNewPatient({ first_name: '', last_name: '', phone_number: '', date_of_birth: '' });
    setModalError(null);
  };

  const openDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      phone_number: patient.phone_number || '',
      date_of_birth: patient.date_of_birth || '',
      email: patient.email || ''
    });
    setIsEditMode(false);
    setEditError(null);
    setActiveDetailsTab('info');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validatePatientForm(newPatient);
    if (error) {
      setModalError(error);
      return;
    }
    setModalError(null);
    setIsSubmitting(true);
    try {
      await createPatient(token, newPatient);
      const updatedPatients = await fetchPatients(token, debouncedSearch);
      setPatients(updatedPatients);
      closeModal();
    } catch (err: any) {
      setModalError(err.message || 'Помилка при створенні пацієнта');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const error = validatePatientForm(editFormData);
    if (error) {
      setEditError(error);
      return;
    }
    setEditError(null);
    setIsUpdating(true);
    try {
      await updatePatient(selectedPatient.id, token, editFormData);
      const updatedPatients = await fetchPatients(token, debouncedSearch);
      setPatients(updatedPatients);
      setSelectedPatient({ ...selectedPatient, ...editFormData } as Patient);
      setIsEditMode(false);
    } catch (err: any) {
      setEditError(err.message || 'Помилка при оновленні пацієнта');
    } finally {
      setIsUpdating(false);
    }
  };

  const todayDate = new Date();
  todayDate.setDate(todayDate.getDate() - 1);
  const maxDate = todayDate.toISOString().split('T')[0];
  const minDate = "1900-01-01";

  return (
    <>
      {/* ОСНОВНИЙ КОНТЕНТ СТОРІНКИ */}
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Пацієнти</h1>
            <p className="text-gray-500 mt-1">Управління базою пацієнтів клініки</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dental-500 shadow-sm"
                placeholder="Пошук..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-sm"
            >
              <Plus size={18} /> Додати
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading && patients.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <User size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Пацієнтів не знайдено</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Пацієнт</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Контакти</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Дата народження</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50/50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold">
                            {patient.first_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{patient.first_name} {patient.last_name}</p>
                            <p className="text-xs text-gray-500">ID: #{patient.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2"><Phone size={14} /> {patient.phone_number}</div>
                          {patient.email && <div className="flex items-center gap-2"><Mail size={14} /> {patient.email}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-600">
                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('uk-UA') : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(patient)}
                            className="text-sm font-semibold text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            Деталі
                          </button>
                          <button
                            onClick={() => setPatientToDelete(patient)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Видалити пацієнта"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛКА СТВОРЕННЯ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={closeModal} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 w-8 h-8 flex items-center justify-center rounded-full">
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Новий пацієнт</h2>
            {modalError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">{modalError}</div>}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Ім'я" value={newPatient.first_name} onChange={e => setNewPatient({ ...newPatient, first_name: e.target.value })} className="px-4 py-2.5 border rounded-xl bg-gray-50" />
                <input required placeholder="Прізвище" value={newPatient.last_name} onChange={e => setNewPatient({ ...newPatient, last_name: e.target.value })} className="px-4 py-2.5 border rounded-xl bg-gray-50" />
              </div>
              <input required placeholder="Телефон +380..." value={newPatient.phone_number} onChange={e => setNewPatient({ ...newPatient, phone_number: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" />
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={newPatient.date_of_birth}
                onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl bg-gray-50"
              />
              <button disabled={isSubmitting} className="w-full mt-4 py-3 bg-dental-600 text-white font-bold rounded-xl">{isSubmitting ? 'Збереження...' : 'Створити'}</button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА ДЕТАЛЕЙ/РЕДАГУВАННЯ */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <div
            className={`bg-white rounded-3xl p-8 w-full shadow-2xl relative transition-all duration-300 ease-in-out ${isEditMode
              ? 'max-w-md'
              : activeDetailsTab === 'chart'
                ? 'max-w-4xl'
                : 'max-w-md'
              }`}
          >
            <button onClick={() => setSelectedPatient(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 w-8 h-8 flex items-center justify-center rounded-full">
              <X size={18} />
            </button>

            <div className="flex justify-between items-center mb-6 pr-12">
              <h2 className="text-2xl font-bold">{isEditMode ? 'Редагування' : 'Деталі пацієнта'}</h2>
              {!isEditMode && activeDetailsTab === 'info' && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 text-sm font-bold text-dental-600 bg-dental-50 px-4 py-2 rounded-xl hover:bg-dental-100 transition-colors"
                >
                  <Edit size={16} /> Редагувати
                </button>
              )}
            </div>

            {editError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{editError}</div>}

            {isEditMode ? (
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" value={editFormData.first_name || ''} onChange={e => setEditFormData({ ...editFormData, first_name: e.target.value })} className="px-4 py-2.5 border rounded-xl bg-gray-50" />
                  <input type="text" value={editFormData.last_name || ''} onChange={e => setEditFormData({ ...editFormData, last_name: e.target.value })} className="px-4 py-2.5 border rounded-xl bg-gray-50" />
                </div>
                <input type="text" value={editFormData.phone_number || ''} onChange={e => setEditFormData({ ...editFormData, phone_number: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" />
                <input type="email" placeholder="Email" value={editFormData.email || ''} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" />
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={editFormData.date_of_birth || ''}
                  onChange={e => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-xl bg-gray-50"
                />
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl">Скасувати</button>
                  <button disabled={isUpdating} className="flex-1 py-3 bg-dental-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Зберегти</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex gap-6 border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveDetailsTab('info')}
                    className={`pb-3 text-sm font-bold transition-colors ${activeDetailsTab === 'info' ? 'border-b-2 border-dental-600 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Основна інформація
                  </button>
                  <button
                    onClick={() => setActiveDetailsTab('chart')}
                    className={`pb-3 text-sm font-bold transition-colors ${activeDetailsTab === 'chart' ? 'border-b-2 border-dental-600 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Зубна формула (FDI)
                  </button>
                </div>

                {activeDetailsTab === 'info' ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-dental-600 text-white flex items-center justify-center font-bold text-lg">{selectedPatient.first_name?.charAt(0)}</div>
                      <div><h3 className="font-bold text-lg">{selectedPatient.first_name} {selectedPatient.last_name}</h3><p className="text-sm text-gray-500">ID: #{selectedPatient.id}</p></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700"><Phone size={16} className="text-dental-500" /> {selectedPatient.phone_number}</div>
                      <div className="flex items-center gap-3 text-gray-700"><Mail size={16} className="text-dental-500" /> {selectedPatient.email || 'Не вказано'}</div>
                      <div className="flex items-center gap-3 text-gray-700"><Calendar size={16} className="text-dental-500" /> {selectedPatient.date_of_birth || 'Не вказано'}</div>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl mt-4">Закрити</button>
                  </div>
                ) : (
                  <AdminDentalChart patientId={selectedPatient.id} token={token} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Видалити пацієнта?</h3>
            <p className="text-gray-500 text-sm mb-8">
              Ви впевнені, що хочете видалити <b>{patientToDelete.first_name} {patientToDelete.last_name}</b>?
              Цю дію неможливо буде скасувати.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setPatientToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Видалення...' : 'Так, видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPatientsPage;