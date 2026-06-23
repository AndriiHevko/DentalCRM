import React, { useState } from 'react';
import { AppointmentEntry, CompleteAppointmentPayload, ToothStatus } from '../../types';
import { completeAppointment } from '../../services/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
    appointment: AppointmentEntry;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

const TOOTH_STATUSES: { value: ToothStatus; label: string }[] = [
    { value: 'healthy', label: 'Здоровий' },
    { value: 'caries', label: 'Карієс' },
    { value: 'filling', label: 'Пломба' },
    { value: 'extracted', label: 'Видалений' },
    { value: 'crown', label: 'Коронка' },
    { value: 'implant', label: 'Імплант' },
    { value: 'other', label: 'Інше' },
];

const topTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const bottomTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const CompleteAppointmentModal: React.FC<Props> = ({ appointment, token, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [totalAmount, setTotalAmount] = useState<string>('');
    const [selectedTeeth, setSelectedTeeth] = useState<Record<number, ToothStatus>>({});

    const toggleTooth = (toothNum: number) => {
        setSelectedTeeth(prev => {
            const copy = { ...prev };
            if (copy[toothNum]) delete copy[toothNum];
            else copy[toothNum] = 'filling';
            return copy;
        });
    };

    const handleStatusChange = (toothNum: number, status: ToothStatus) => {
        setSelectedTeeth(prev => ({ ...prev, [toothNum]: status }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!diagnosis.trim()) return setError('Введіть діагноз!');
        if (!totalAmount || isNaN(Number(totalAmount))) return setError('Введіть коректну суму!');

        const treated_teeth = Object.keys(selectedTeeth).map(Number);
        const dental_chart_updates: Record<number, any> = {};
        treated_teeth.forEach(num => {
            dental_chart_updates[num] = { status: selectedTeeth[num] };
        });

        const payload: CompleteAppointmentPayload = {
            diagnosis,
            notes,
            total_amount: Number(totalAmount),
            performed_services: appointment.service ? [appointment.service] : [],
            treated_teeth,
            dental_chart_updates
        };

        setIsSubmitting(true);
        setError(null);
        try {
            await completeAppointment(appointment.id, token, payload);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Помилка завершення прийому');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative my-auto animate-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                    <X size={18} />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Завершення прийому</h2>
                <p className="text-gray-500 mb-6">
                    Пацієнт: <b>{appointment.patient_name || 'Невідомо'}</b> |
                    Послуга: <b>{appointment.service_name}</b>
                </p>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Діагноз *</label>
                            <input required type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Наприклад: Гострий пульпіт" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Сума до сплати (₴) *</label>
                            <input required type="number" min="0" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50 font-bold text-dental-700" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Ліковані зуби (натисніть для виділення)</label>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-4 overflow-x-auto">
                            <div className="flex justify-center gap-1 min-w-max mb-2">
                                {topTeeth.map(num => (
                                    <button key={num} type="button" onClick={() => toggleTooth(num)} className={`w-8 h-10 flex items-center justify-center rounded-md text-xs font-bold transition-all border ${selectedTeeth[num] ? 'bg-dental-500 text-white border-dental-600 shadow-inner' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-center gap-1 min-w-max">
                                {bottomTeeth.map(num => (
                                    <button key={num} type="button" onClick={() => toggleTooth(num)} className={`w-8 h-10 flex items-center justify-center rounded-md text-xs font-bold transition-all border ${selectedTeeth[num] ? 'bg-dental-500 text-white border-dental-600 shadow-inner' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {Object.keys(selectedTeeth).length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.keys(selectedTeeth).map(num => (
                                    <div key={num} className="flex items-center gap-2 bg-white border border-dental-200 p-2 rounded-xl">
                                        <span className="font-bold text-dental-700 bg-dental-50 px-2 py-1 rounded-lg text-sm">{num}</span>
                                        <select value={selectedTeeth[Number(num)]} onChange={(e) => handleStatusChange(Number(num), e.target.value as ToothStatus)} className="w-full bg-transparent text-sm font-medium focus:outline-none cursor-pointer">
                                            {TOOTH_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Нотатки для лікаря</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Додаткові деталі лікування..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50 resize-none" />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">Скасувати</button>
                        <button disabled={isSubmitting} type="submit" className="flex-[2] flex items-center justify-center gap-2 py-3 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50">
                            <CheckCircle size={18} /> {isSubmitting ? 'Збереження...' : 'Завершити та виставити рахунок'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};