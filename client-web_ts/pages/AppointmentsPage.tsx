import React, { useState, useEffect } from 'react';
import { AppointmentEntry, Doctor, ServiceItem } from '../types';
import { createAppointment, fetchDoctorAvailability, cancelAppointment } from '../services/api';
import { CalendarPlus, Clock, User, CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';

interface AppointmentsPageProps {
    token: string;
    appointments: AppointmentEntry[];
    doctors: Doctor[];
    services: ServiceItem[];
    onRefresh: () => void;
}

interface CreatedAppointmentDetails {
    doctorName?: string;
    serviceName?: string;
    date: string;
    time: string;
}

const ITEMS_PER_PAGE = 5;

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
    token,
    appointments,
    doctors,
    services,
    onRefresh
}) => {
    // Стан для форми
    const [newAppointment, setNewAppointment] = useState({ doctor: '', service: '', date: '', time: '', notes: '' });
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // Стани завантаження та помилок
    const [creatingAppointment, setCreatingAppointment] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdDetails, setCreatedDetails] = useState<CreatedAppointmentDetails | null>(null);

    // Стан для скасування запису (модальне вікно)
    const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentEntry | null>(null);
    const [isCancelling, setIsCancelling] = useState<number | null>(null);

    // Стан пагінації
    const [currentPage, setCurrentPage] = useState(1);

    // Фільтрація актуальних записів
    const activeAppointments = appointments.filter(app =>
        app.status !== 'done' && app.status !== 'cancelled'
    );

    // Логіка пагінації
    const totalPages = Math.ceil(activeAppointments.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentAppointments = activeAppointments.slice(indexOfFirstItem, indexOfLastItem);

    // Завантаження слотів часу
    useEffect(() => {
        if (newAppointment.doctor && newAppointment.date && newAppointment.service) {
            setIsLoadingSlots(true);
            setNewAppointment(prev => ({ ...prev, time: '' }));
            fetchDoctorAvailability(parseInt(newAppointment.doctor), newAppointment.date, parseInt(newAppointment.service))
                .then(setAvailableSlots)
                .catch(() => setAvailableSlots([]))
                .finally(() => setIsLoadingSlots(false));
        } else {
            setAvailableSlots([]);
        }
    }, [newAppointment.doctor, newAppointment.date, newAppointment.service]);

    // Обробка створення запису
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAppointment.time) {
            setError('Оберіть час прийому!');
            return;
        }

        setCreatingAppointment(true);
        setError(null);
        try {
            const dt = `${newAppointment.date}T${newAppointment.time}:00`;

            await createAppointment({
                doctor: parseInt(newAppointment.doctor),
                service: parseInt(newAppointment.service),
                appointment_datetime: dt,
                notes: newAppointment.notes
            }, token);

            setCreatedDetails({
                doctorName: doctors.find(d => d.id === parseInt(newAppointment.doctor))?.full_name,
                serviceName: services.find(s => s.id === parseInt(newAppointment.service))?.name,
                date: newAppointment.date,
                time: newAppointment.time
            });

            setNewAppointment({ doctor: '', service: '', date: '', time: '', notes: '' });
            setCurrentPage(1);
            onRefresh();
        } catch (err) {
            setError('Помилка при створенні запису');
        } finally {
            setCreatingAppointment(false);
        }
    };

    const handleCancelClick = (appointment: AppointmentEntry) => {
        setAppointmentToCancel(appointment);
    };

    // Підтвердження скасування в модалці
    const confirmCancelAppointment = async () => {
        if (!appointmentToCancel) return;

        setIsCancelling(appointmentToCancel.id);
        try {
            await cancelAppointment(appointmentToCancel.id, token);

            if (currentAppointments.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            }
            onRefresh();
            setAppointmentToCancel(null);
        } catch (error: any) {
            alert(error.message || "Помилка при скасуванні запису");
        } finally {
            setIsCancelling(null);
        }
    };

    // Розрахунок валідних слотів
    const localNow = new Date();
    const tzOffset = localNow.getTimezoneOffset() * 60000;
    const todayLocalISO = new Date(localNow.getTime() - tzOffset).toISOString().split('T')[0];

    const validSlots = availableSlots.filter(slot => {
        if (newAppointment.date !== todayLocalISO) return true;
        const checkTime = new Date();
        checkTime.setMinutes(checkTime.getMinutes() + 5);
        return slot >= `${String(checkTime.getHours()).padStart(2, '0')}:${String(checkTime.getMinutes()).padStart(2, '0')}`;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* СПИСОК АКТУАЛЬНИХ ЗАПИСІВ */}
            <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Clock className="text-dental-500" /> Ваші актуальні записи
                </h3>

                {activeAppointments.length > 0 ? (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 gap-4">
                            {currentAppointments.map(app => (
                                <div key={app.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-gray-50">
                                    <div className="flex flex-col gap-3 flex-1">
                                        <div className="flex justify-between items-start sm:justify-start sm:gap-4">
                                            <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-500 uppercase">
                                                {new Date(app.appointment_datetime).toLocaleDateString('uk-UA')} о {app.appointment_datetime.split('T')[1].substring(0, 5)}
                                            </span>
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${app.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {app.status === 'scheduled' ? 'Підтверджено' : 'Очікує'}
                                            </span>
                                        </div>
                                        <p className="font-bold text-gray-900">{app.service_name}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <User size={14} /> Лікар: {app.doctor_name}
                                        </div>
                                    </div>

                                    {(app.status === 'pending' || app.status === 'scheduled') && (
                                        <button
                                            onClick={() => handleCancelClick(app)}
                                            className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition-colors bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                        >
                                            Скасувати запис
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                    aria-label="Попередня сторінка"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm font-medium text-gray-600">
                                    Сторінка {currentPage} з {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                    aria-label="Наступна сторінка"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        Наразі у вас немає активних записів
                    </div>
                )}
            </section>

            {/* ФОРМА НОВОГО ЗАПИСУ */}
            <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <CalendarPlus className="text-teal-500" /> Записатися на прийом
                </h3>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Лікар</label>
                        <select
                            value={newAppointment.doctor}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, doctor: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50 outline-none transition-shadow"
                            required
                        >
                            <option value="">Оберіть лікаря</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Послуга</label>
                        <select
                            value={newAppointment.service}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, service: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50 outline-none transition-shadow"
                            required
                        >
                            <option value="">Оберіть послугу</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.price}₴</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                        <input
                            type="date"
                            value={newAppointment.date}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50 outline-none transition-shadow"
                            min={todayLocalISO}
                            required
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Опишіть вашу проблему (необов'язково)</label>
                        <textarea
                            value={newAppointment.notes}
                            onChange={(e) => setNewAppointment(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50 resize-none outline-none transition-shadow"
                            rows={3}
                            placeholder="Наприклад: турбує біль у нижньому лівому зубі..."
                        />
                    </div>

                    <div className="md:col-span-3 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-800 mb-4">Оберіть час прийому</label>

                        {!newAppointment.doctor || !newAppointment.date || !newAppointment.service ? (
                            <div className="bg-amber-50 text-amber-700 px-5 py-4 rounded-xl border border-amber-100 font-medium text-sm flex items-center gap-2">
                                💡 Оберіть лікаря, послугу та дату, щоб побачити вільні слоти
                            </div>
                        ) : isLoadingSlots ? (
                            <div className="bg-gray-50 text-gray-500 px-5 py-4 rounded-xl border border-gray-200 font-medium text-sm animate-pulse">
                                Завантаження вільних годин...
                            </div>
                        ) : validSlots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {validSlots.map(slot => {
                                    const timeStr = slot.substring(0, 5);
                                    return (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setNewAppointment(prev => ({ ...prev, time: timeStr }))}
                                            className={`py-3 px-2 text-sm rounded-xl border font-bold transition-all duration-200 ${newAppointment.time === timeStr
                                                    ? 'bg-dental-600 text-white border-dental-600 shadow-md transform scale-105'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-dental-50 hover:border-dental-300'
                                                }`}
                                        >
                                            {timeStr}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-red-50 text-red-600 px-5 py-4 rounded-xl border border-red-100 font-medium text-sm">
                                ❌ На обрану дату немає вільних слотів. Спробуйте інший день.
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-3 flex justify-end mt-4">
                        <button
                            type="submit"
                            disabled={creatingAppointment || !newAppointment.time}
                            className="px-8 py-3 bg-dental-600 text-white font-bold rounded-xl shadow-lg hover:bg-dental-700 disabled:opacity-50 disabled:hover:bg-dental-600 disabled:cursor-not-allowed transition-all"
                        >
                            {creatingAppointment ? 'Обробка...' : 'Підтвердити запис'}
                        </button>
                    </div>
                </form>
            </section>

            {/* ПОПАП УСПІХУ */}
            {createdDetails && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Запис успішно створено!</h2>
                        <div className="text-left bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100">
                            <p className="text-sm text-gray-500 mb-3 border-b border-gray-200 pb-2">
                                Лікар: <span className="text-gray-900 font-bold block mt-1">{createdDetails.doctorName}</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-3 border-b border-gray-200 pb-2">
                                Послуга: <span className="text-gray-900 font-bold block mt-1">{createdDetails.serviceName}</span>
                            </p>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Дата:</p>
                                    <p className="text-gray-900 font-bold mt-1">{new Date(createdDetails.date).toLocaleDateString('uk-UA')}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500">Час:</p>
                                    <p className="text-gray-900 font-bold mt-1">{createdDetails.time}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setCreatedDetails(null)}
                            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-md"
                        >
                            Чудово, дякую
                        </button>
                    </div>
                </div>
            )}

            {/* МОДАЛКА ПІДТВЕРДЖЕННЯ СКАСУВАННЯ */}
            {appointmentToCancel && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
                    <div className="bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200">

                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Скасувати запис?</h3>

                        <p className="text-gray-500 text-xs sm:text-sm mb-6">
                            Ви впевнені, що хочете скасувати запис до лікаря <b>{appointmentToCancel.doctor_name}</b> на процедуру <b>{appointmentToCancel.service_name}</b>?
                            Цю дію неможливо буде відмінити.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setAppointmentToCancel(null)}
                                className="flex-1 py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                            >
                                Назад
                            </button>
                            <button
                                onClick={confirmCancelAppointment}
                                disabled={isCancelling === appointmentToCancel.id}
                                className="flex-1 py-3 text-sm sm:text-base bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                            >
                                {isCancelling === appointmentToCancel.id ? 'Обробка...' : 'Так, скасувати'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};