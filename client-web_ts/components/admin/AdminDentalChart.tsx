import React, { useEffect, useState } from 'react';
import { Tooth, ToothStatus, DentalChartUpdate } from '../../types';
import { fetchPatientDentalChart, updatePatientToothStatus } from '../../services/api';
import { Save, X, Loader2 } from 'lucide-react';

interface Props {
    patientId: number;
    token: string;
}

const FDI_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const FDI_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const FDI_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const FDI_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const STATUS_COLORS: Record<ToothStatus, string> = {
    healthy: 'bg-white border-gray-200 text-gray-700',
    caries: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    filling: 'bg-blue-100 border-blue-400 text-blue-800',
    extracted: 'bg-gray-100 border-gray-400 text-gray-400 opacity-60 line-through',
    crown: 'bg-purple-100 border-purple-400 text-purple-800',
    implant: 'bg-teal-100 border-teal-400 text-teal-800',
    other: 'bg-red-100 border-red-400 text-red-800',
};

const STATUS_LABELS: Record<ToothStatus, string> = {
    healthy: 'Здоровий',
    caries: 'Карієс',
    filling: 'Пломба',
    extracted: 'Видалений',
    crown: 'Коронка',
    implant: 'Імплант',
    other: 'Інше',
};

const AdminDentalChart: React.FC<Props> = ({ patientId, token }) => {
    const [teeth, setTeeth] = useState<Tooth[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [editStatus, setEditStatus] = useState<ToothStatus>('healthy');
    const [editNotes, setEditNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadChart();
    }, [patientId]);

    const loadChart = async () => {
        setLoading(true);
        try {
            const data = await fetchPatientDentalChart(patientId, token);
            setTeeth(data);
        } catch (err) {
            console.error('Failed to load dental chart', err);
        } finally {
            setLoading(false);
        }
    };

    const getTooth = (num: number): Tooth => {
        return teeth.find(t => t.tooth_number === num) || { id: 0, tooth_number: num, status: 'healthy' };
    };

    const handleToothClick = (num: number) => {
        const tooth = getTooth(num);
        setSelectedTooth(num);
        setEditStatus(tooth.status);
        setEditNotes(tooth.notes || '');
    };

    const handleSaveTooth = async () => {
        if (!selectedTooth) return;
        setIsSaving(true);
        try {
            const updateData = {
                tooth_number: selectedTooth,
                status: editStatus,
                notes: editNotes
            };

            // Перевірка чи є зуб вже у списку, щоб вирішити POST чи PUT
            const existingTooth = teeth.find(t => t.tooth_number === selectedTooth && t.id !== 0);
            const isUpdate = !!existingTooth;

            const updatedTooth = await updatePatientToothStatus(patientId, updateData, token, isUpdate);

            setTeeth(prev => {
                if (existingTooth) {
                    return prev.map(t => t.tooth_number === selectedTooth ? updatedTooth : t);
                }
                return [...prev, updatedTooth];
            });
            setSelectedTooth(null);
        } catch (err) {
            alert('Помилка при збереженні стану зуба');
        } finally {
            setIsSaving(false);
        }
    };

    const renderQuadrant = (numbers: number[]) => (
        <div className="flex gap-1">
            {numbers.map(num => {
                const tooth = getTooth(num);
                const isActive = selectedTooth === num;
                return (
                    <button
                        key={num}
                        onClick={() => handleToothClick(num)}
                        className={`w-10 h-12 rounded border-2 flex items-center justify-center font-bold text-sm transition-all
              ${STATUS_COLORS[tooth.status]} 
              ${isActive ? 'ring-2 ring-dental-600 ring-offset-2 scale-110 shadow-md' : 'hover:bg-gray-50'}`}
                        title={`${num} - ${STATUS_LABELS[tooth.status]}`}
                    >
                        {num}
                    </button>
                );
            })}
        </div>
    );

    if (loading) {
        return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-dental-600" size={32} /></div>;
    }

    return (
        <div className="space-y-6">
            {/* FDI Формула */}
            <div className="bg-gray-50 p-6 rounded-2xl overflow-x-auto">
                <div className="min-w-max flex flex-col items-center gap-4">
                    <div className="flex gap-4 border-b-2 border-gray-300 pb-4">
                        {renderQuadrant(FDI_UPPER_RIGHT)}
                        <div className="w-px bg-gray-300 mx-2" />
                        {renderQuadrant(FDI_UPPER_LEFT)}
                    </div>
                    <div className="flex gap-4">
                        {renderQuadrant(FDI_LOWER_RIGHT)}
                        <div className="w-px bg-gray-300 mx-2" />
                        {renderQuadrant(FDI_LOWER_LEFT)}
                    </div>
                </div>
            </div>

            {/* Панель редагування */}
            {selectedTooth && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                            <span className="bg-dental-100 text-dental-700 px-3 py-1 rounded-lg">Зуб {selectedTooth}</span>
                        </h4>
                        <button onClick={() => setSelectedTooth(null)} className="text-gray-400 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                            <select
                                value={editStatus}
                                onChange={e => setEditStatus(e.target.value as ToothStatus)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50"
                            >
                                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Нотатки</label>
                            <input
                                type="text"
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                                placeholder="Додаткова інформація..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveTooth}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-dental-600 text-white font-bold rounded-xl hover:bg-dental-700 disabled:opacity-70 transition-colors"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Зберегти стан
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDentalChart;