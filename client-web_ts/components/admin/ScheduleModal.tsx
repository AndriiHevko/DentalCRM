import React, { useState } from 'react';
import { Doctor, WorkScheduleDTO } from '../../types';
import { saveWorkSchedule, deleteWorkSchedule } from '../../services/api';
import { X, Clock, Coffee, Copy, Trash2, Save } from 'lucide-react';

interface Props {
    doctor: Doctor;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

const DAYS = [
    { id: 1, label: 'Понеділок' },
    { id: 2, label: 'Вівторок' },
    { id: 3, label: 'Середа' },
    { id: 4, label: 'Четвер' },
    { id: 5, label: 'П’ятниця' },
    { id: 6, label: 'Субота' },
    { id: 7, label: 'Неділя' },
];

export const ScheduleModal: React.FC<Props> = ({ doctor, token, onClose, onSuccess }) => {
    const [schedules, setSchedules] = useState<any[]>(doctor.work_schedules || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getDaySchedule = (dayId: number) => schedules.find(s => s.day_of_week === dayId);

    const handleUpdateDay = (dayId: number, field: string, value: string) => {
        setSchedules(prev => {
            const existing = prev.find(s => s.day_of_week === dayId);
            if (existing) {
                return prev.map(s => s.day_of_week === dayId ? { ...s, [field]: value } : s);
            }
            return [...prev, { doctor: doctor.id, day_of_week: dayId, [field]: value, start_time: '09:00', end_time: '18:00' }];
        });
    };

    const copyToAll = (sourceDayId: number) => {
        const source = getDaySchedule(sourceDayId);
        if (!source) return;
        const newSchedules = DAYS.map(d => ({
            ...source,
            id: getDaySchedule(d.id)?.id,
            day_of_week: d.id
        }));
        setSchedules(newSchedules);
    };

    const removeDay = async (dayId: number) => {
        const sched = getDaySchedule(dayId);
        if (sched?.id) {
            await deleteWorkSchedule(token, sched.id);
        }
        setSchedules(prev => prev.filter(s => s.day_of_week !== dayId));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            for (const s of schedules) {
                await saveWorkSchedule(token, s);
            }
            onSuccess();
        } catch (err) {
            alert('Помилка при збереженні розкладу');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">

            <div className="hide-arrows bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors"><X size={18} /></button>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Графік роботи</h2>
                <p className="text-gray-500 mb-8">Лікар: <span className="font-bold text-gray-900">{doctor.full_name}</span></p>

                <div className="space-y-4">
                    {DAYS.map(day => {
                        const s = getDaySchedule(day.id);
                        return (
                            <div key={day.id} className={`p-4 rounded-2xl border transition-all ${s ? 'border-dental-100 bg-dental-50/30' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        <span className="font-bold text-gray-900">{day.label}</span>
                                        {!s && <button onClick={() => handleUpdateDay(day.id, 'start_time', '09:00')} className="text-xs font-bold text-dental-600 hover:underline">+ Додати зміну</button>}
                                    </div>

                                    {s && (
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                <input type="time" value={s.start_time.substring(0, 5)} onChange={e => handleUpdateDay(day.id, 'start_time', e.target.value)} className="bg-white border rounded-lg px-2 py-1 text-sm font-bold" />
                                                <span className="text-gray-400">—</span>
                                                <input type="time" value={s.end_time.substring(0, 5)} onChange={e => handleUpdateDay(day.id, 'end_time', e.target.value)} className="bg-white border rounded-lg px-2 py-1 text-sm font-bold" />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Coffee size={16} className="text-gray-400" />
                                                <span className="text-xs text-gray-500 uppercase font-bold">Обід:</span>
                                                <input type="time" value={s.lunch_start?.substring(0, 5) || ''} onChange={e => handleUpdateDay(day.id, 'lunch_start', e.target.value)} className="bg-white border rounded-lg px-2 py-1 text-sm" />
                                                <input type="time" value={s.lunch_end?.substring(0, 5) || ''} onChange={e => handleUpdateDay(day.id, 'lunch_end', e.target.value)} className="bg-white border rounded-lg px-2 py-1 text-sm" />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button onClick={() => copyToAll(day.id)} title="Копіювати на всі дні" className="p-2 text-dental-600 hover:bg-dental-100 rounded-lg transition-colors"><Copy size={16} /></button>
                                                <button onClick={() => removeDay(day.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">Скасувати</button>
                    <button onClick={handleSave} disabled={isSubmitting} className="flex-[2] flex items-center justify-center gap-2 py-3 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"><Save size={18} /> {isSubmitting ? 'Збереження...' : 'Зберегти весь розклад'}</button>
                </div>
            </div>
        </div>
    );
};