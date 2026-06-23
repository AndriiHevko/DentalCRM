import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppointmentEntry, UserProfile } from '../../types';
import { fetchAllAppointments, updateAppointmentStatus, updateAppointment,
         fetchDoctors, fetchServices, fetchDoctorAvailability, fetchPatients,
         createAppointment, createPatient } from '../../services/api';
import { Calendar, Clock, User, Edit, XCircle, X, Save, Stethoscope, Settings, Users, Plus, UserPlus } from 'lucide-react';

interface AdminContext {
    token: string;
    userProfile: UserProfile;
}

const AdminAppointmentsPage: React.FC = () => {
    const { token } = useOutletContext<AdminContext>();
    const [appointments, setAppointments] = useState<AppointmentEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [doctors, setDoctors] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);

    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Стани для редагування
    const [editingAppointment, setEditingAppointment] = useState<AppointmentEntry | null>(null);
    const [editForm, setEditForm] = useState({
        date: '', time: '', status: '', notes: '', patient: '', doctor: '', service: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Стани для створення нового запису
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [isSubmittingNew, setIsSubmittingNew] = useState(false);

    const [createForm, setCreateForm] = useState({
        patient: '', doctor: '', service: '', date: '', time: '', notes: ''
    });
    const [newPatientForm, setNewPatientForm] = useState({
        first_name: '', last_name: '', phone_number: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [apptData, docsData, servData, patsData] = await Promise.all([
                fetchAllAppointments(token, currentPage),
                fetchDoctors(),
                fetchServices(),
                fetchPatients(token)
            ]);

            if (apptData && apptData.results) {
                setAppointments(apptData.results);
                setTotalPages(Math.ceil(apptData.count / 15));
            } else {
                setAppointments(Array.isArray(apptData) ? apptData : []);
                setTotalPages(1);
            }

            setDoctors(docsData);
            setServices(servData);
            setPatients(patsData);
        } catch (err) {
            console.error('Помилка завантаження даних', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInitialData(); }, [token, currentPage]);

    // Effect для завантаження вільних слотів (Редагування)
    useEffect(() => {
        if (editForm.doctor && editForm.date && editForm.service && editingAppointment) {
            setIsLoadingSlots(true);
            fetchDoctorAvailability(parseInt(editForm.doctor), editForm.date, parseInt(editForm.service))
                .then(slots => {
                    let finalSlots = [...slots];
                    const origDateObj = new Date(editingAppointment.appointment_datetime);
                    const origTzOffset = origDateObj.getTimezoneOffset() * 60000;
                    const origLocal = new Date(origDateObj.getTime() - origTzOffset).toISOString();
                    const origDate = origLocal.split('T')[0];
                    const origTime = origLocal.split('T')[1].substring(0, 5);

                    if (editForm.date === origDate && editForm.doctor === editingAppointment.doctor?.toString()) {
                        if (!finalSlots.includes(origTime)) {
                            finalSlots.push(origTime);
                            finalSlots.sort();
                        }
                    }
                    setAvailableSlots(finalSlots);
                })
                .catch(() => setAvailableSlots([]))
                .finally(() => setIsLoadingSlots(false));
        } else if (!isCreateModalOpen) {
            setAvailableSlots([]);
        }
    }, [editForm.doctor, editForm.date, editForm.service, editingAppointment]);

    // Effect для завантаження вільних слотів (Створення)
    useEffect(() => {
        if (createForm.doctor && createForm.date && createForm.service && isCreateModalOpen) {
            setIsLoadingSlots(true);
            // Виклик API для перевірки слотів на основі лікаря та послуги
            fetchDoctorAvailability(parseInt(createForm.doctor), createForm.date, parseInt(createForm.service))
                .then(slots => setAvailableSlots(slots))
                .catch(() => setAvailableSlots([]))
                .finally(() => setIsLoadingSlots(false));
        } else if (!editingAppointment) {
            setAvailableSlots([]);
        }
    }, [createForm.doctor, createForm.date, createForm.service, isCreateModalOpen]);

    const resetCreateForm = () => {
        setCreateForm({ patient: '', doctor: '', service: '', date: '', time: '', notes: '' });
        setNewPatientForm({ first_name: '', last_name: '', phone_number: '' });
        setIsCreatingPatient(false);
        setIsCreateModalOpen(false);
        setAvailableSlots([]);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.time) {
            alert("Оберіть час прийому!");
            return;
        }

        setIsSubmittingNew(true);
        try {
            let finalPatientId = createForm.patient;

            // Якщо адмін створює нового пацієнта
            if (isCreatingPatient) {
                const createdPatient = await createPatient(token, newPatientForm);
                finalPatientId = createdPatient.id.toString();
                // Оновлення локального списку пацієнтів
                setPatients(prev => [...prev, createdPatient]);
            }

            const datetimeStr = `${createForm.date}T${createForm.time}:00`;
            const payload = {
                patient: parseInt(finalPatientId),
                doctor: parseInt(createForm.doctor),
                service: parseInt(createForm.service),
                appointment_datetime: new Date(datetimeStr).toISOString(),
                notes: createForm.notes,
                status: 'scheduled'
            };

            await createAppointment(payload, token);
            resetCreateForm();
            loadInitialData();
        } catch (err: any) {
            console.error(err);
            alert("Помилка при створенні запису. Перевірте графік лікаря.");
        } finally {
            setIsSubmittingNew(false);
        }
    };

    const openEditModal = (app: any) => {
        setEditingAppointment(app);
        const dateObj = new Date(app.appointment_datetime);
        const tzOffset = dateObj.getTimezoneOffset() * 60000;
        const localISO = new Date(dateObj.getTime() - tzOffset).toISOString();

        setEditForm({
            date: localISO.split('T')[0],
            time: localISO.split('T')[1].substring(0, 5),
            status: app.status,
            notes: app.notes || '',
            patient: app.patient_id?.toString() || '',
            doctor: app.doctor_id?.toString() || '',
            service: app.service_id?.toString() || ''
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAppointment) return;
        if (!editForm.time) return alert("Оберіть час прийому!");

        setIsUpdating(true);
        try {
            const datetimeStr = `${editForm.date}T${editForm.time}:00`;
            const payload = {
                ...editForm,
                patient: parseInt(editForm.patient),
                doctor: parseInt(editForm.doctor),
                service: parseInt(editForm.service),
                appointment_datetime: new Date(datetimeStr).toISOString()
            };

            await updateAppointment(editingAppointment.id, token, payload);
            setEditingAppointment(null);
            loadInitialData();
        } catch (err) {
            alert("Помилка при оновленні запису");
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-xs font-bold uppercase">Очікує</span>;
            case 'scheduled': return <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold uppercase">Підтверджено</span>;
            case 'in_progress': return <span className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold uppercase">В процесі</span>;
            case 'done': return <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-xs font-bold uppercase">Завершено</span>;
            case 'cancelled': return <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold uppercase">Скасовано</span>;
            default: return <span className="px-3 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-lg text-xs font-bold uppercase">{status}</span>;
        }
    };

    return (
        <>
            <style>{`
                .hide-arrows::-webkit-scrollbar { width: 14px !important; }
                .hide-arrows::-webkit-scrollbar-track { background: transparent !important; margin: 20px 0 !important; }
                .hide-arrows::-webkit-scrollbar-thumb { background-color: #d1d5db !important; border-radius: 9999px !important; border: 4px solid white !important; background-clip: padding-box !important; }
                .hide-arrows::-webkit-scrollbar-thumb:hover { background-color: #9ca3af !important; border: 4px solid white !important; background-clip: padding-box !important; }
                .hide-arrows::-webkit-scrollbar-button { width: 0px !important; height: 0px !important; display: none !important; }
            `}</style>

            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Всі записи</h1>
                        <p className="text-gray-500 mt-1">Організація візитів та управління розкладом пацієнтів</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} /> Створити запис
                    </button>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 font-bold">Записів не знайдено</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Дата та Час</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Пацієнт</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Послуга та Лікар</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Статус</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.map((app) => {
                                        const dateObj = new Date(app.appointment_datetime);
                                        return (
                                            <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 flex items-center gap-1"><Calendar size={14} className="text-dental-500" /> {dateObj.toLocaleDateString('uk-UA')}</span>
                                                        <span className="text-sm font-bold text-gray-500 flex items-center gap-1 mt-1"><Clock size={14} /> {dateObj.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{app.patient_name || 'Невідомо'}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">{app.patient_phone}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-800 text-sm bg-gray-50 inline-block px-2 py-1 rounded-lg border border-gray-200">{app.service_name}</p>
                                                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1 mt-2"><User size={12} /> {app.doctor_name}</p>
                                                </td>
                                                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openEditModal(app)} className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                                                            <Edit size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                                    <span className="text-sm text-gray-500 font-medium">Сторінка {currentPage} з {totalPages}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Попередня</button>
                                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50">Наступна</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Модальне вікно для створення нового запису */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="hide-arrows bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <button onClick={resetCreateForm} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 w-8 h-8 flex items-center justify-center rounded-full">
                            <X size={18} />
                        </button>
                        <h2 className="text-2xl font-bold mb-6">Створення нового запису</h2>

                        <form onSubmit={handleCreateSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Блок Пацієнта */}
                                <div className="md:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-sm font-bold text-gray-700">Пацієнт</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingPatient(!isCreatingPatient)}
                                            className="text-sm text-dental-600 font-bold flex items-center gap-1 hover:text-dental-700"
                                        >
                                            {isCreatingPatient ? <><Users size={14} /> Вибрати існуючого</> : <><UserPlus size={14} /> Створити нового</>}
                                        </button>
                                    </div>

                                    {isCreatingPatient ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                type="text" placeholder="Ім'я" required
                                                value={newPatientForm.first_name}
                                                onChange={e => setNewPatientForm({ ...newPatientForm, first_name: e.target.value })}
                                                className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-dental-500"
                                            />
                                            <input
                                                type="text" placeholder="Прізвище" required
                                                value={newPatientForm.last_name}
                                                onChange={e => setNewPatientForm({ ...newPatientForm, last_name: e.target.value })}
                                                className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-dental-500"
                                            />
                                            <input
                                                type="tel" placeholder="Телефон (+380...)" required
                                                value={newPatientForm.phone_number}
                                                onChange={e => setNewPatientForm({ ...newPatientForm, phone_number: e.target.value })}
                                                className="sm:col-span-2 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-dental-500"
                                            />
                                        </div>
                                    ) : (
                                        <select
                                            value={createForm.patient}
                                            onChange={e => setCreateForm({ ...createForm, patient: e.target.value })}
                                            className="w-full px-4 py-2.5 border rounded-xl bg-white focus:ring-2 focus:ring-dental-500"
                                            required={!isCreatingPatient}
                                        >
                                            <option value="">Оберіть пацієнта</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.phone_number})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Лікар, Послуга, Дата */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Лікар</label>
                                    <select
                                        value={createForm.doctor}
                                        onChange={e => setCreateForm({ ...createForm, doctor: e.target.value, time: '' })}
                                        className="w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-dental-500"
                                        required
                                    >
                                        <option value="">Оберіть лікаря</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Послуга</label>
                                    <select
                                        value={createForm.service}
                                        onChange={e => setCreateForm({ ...createForm, service: e.target.value, time: '' })}
                                        className="w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-dental-500"
                                        required
                                    >
                                        <option value="">Оберіть послугу</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.price} грн)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Дата</label>
                                    <input
                                        type="date"
                                        value={createForm.date}
                                        min={new Date().toISOString().split('T')[0]} // Забороняємо дати в минулому
                                        onChange={e => setCreateForm({ ...createForm, date: e.target.value, time: '' })}
                                        className="w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-dental-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Блок слотів */}
                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-800 mb-3">Час прийому</label>
                                {!createForm.doctor || !createForm.date || !createForm.service ? (
                                    <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl border border-amber-100 text-sm">💡 Оберіть лікаря, послугу та дату для перегляду слотів</div>
                                ) : isLoadingSlots ? (
                                    <div className="bg-gray-50 text-gray-500 px-4 py-3 rounded-xl border border-gray-200 text-sm">Оновлення графіка...</div>
                                ) : availableSlots.length > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setCreateForm(prev => ({ ...prev, time: slot }))}
                                                className={`py-2 px-1 text-sm rounded-xl border font-bold transition-all ${createForm.time === slot
                                                    ? 'bg-dental-600 text-white border-dental-600 shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-dental-50'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm">❌ Немає вільних слотів на цю дату</div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Коментар</label>
                                <textarea
                                    value={createForm.notes}
                                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-dental-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={resetCreateForm} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors">
                                    Скасувати
                                </button>
                                <button type="submit" disabled={isSubmittingNew || !createForm.time} className="flex-1 py-3 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                    <Plus size={18} /> Створити запис
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальне вікно редагування запису */}
            {editingAppointment && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">
                    <div className="hide-arrows bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setEditingAppointment(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 w-8 h-8 flex items-center justify-center rounded-full"><X size={18} /></button>
                        <h2 className="text-2xl font-bold mb-6">Детальне редагування запису</h2>

                        <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Пацієнт</label>
                                    <select value={editForm.patient} onChange={e => setEditForm({ ...editForm, patient: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required>
                                        <option value="">Оберіть пацієнта</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Лікар</label>
                                    <select value={editForm.doctor} onChange={e => setEditForm({ ...editForm, doctor: e.target.value, time: '' })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required>
                                        {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.full_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Послуга</label>
                                    <select value={editForm.service} onChange={e => setEditForm({ ...editForm, service: e.target.value, time: '' })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Дата</label>
                                    <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value, time: '' })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Статус запису</label>
                                    <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-4 py-2.5 border rounded-xl bg-gray-50">
                                        <option value="pending">Очікує</option>
                                        <option value="scheduled">Підтверджено</option>
                                        <option value="in_progress">В процесі</option>
                                        <option value="done">Завершено</option>
                                        <option value="cancelled">Скасовано</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-sm font-bold text-gray-800 mb-3">Час прийому</label>
                                {isLoadingSlots ? <div className="bg-gray-50 px-4 py-3 rounded-xl border text-sm">Оновлення...</div> : (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                        {availableSlots.map(slot => (
                                            <button key={slot} type="button" onClick={() => setEditForm(prev => ({ ...prev, time: slot }))}
                                                className={`py-2 px-1 text-sm rounded-xl border font-bold ${editForm.time === slot ? 'bg-dental-600 text-white' : 'bg-white hover:bg-dental-50'}`}>
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setEditingAppointment(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors">Скасувати</button>
                                <button type="submit" disabled={isUpdating || !editForm.time} className="flex-1 py-3 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                    <Save size={18} /> Зберегти зміни
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminAppointmentsPage;