import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserProfile, StatisticsData } from '../../types';
import { fetchStatistics, exportStatisticsPDF } from '../../services/api';
import { DollarSign, Users, Calendar, Stethoscope, TrendingUp, Download, Loader2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

interface AdminContext { token: string; userProfile: UserProfile; }

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(value);

const AdminStatisticsPage: React.FC = () => {
    const { token } = useOutletContext<AdminContext>();
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('monthly');

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                const stats = await fetchStatistics(token, period);
                setData(stats);
            } catch (err: any) {
                setError(err.message || "Не вдалося завантажити статистику");
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [token, period]);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            await exportStatisticsPDF(token, period);
        } catch (err: any) {
            alert(err.message || "Помилка при завантаженні звіту");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-dental-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                {error || "Дані не знайдені"}
            </div>
        );
    }

    const { overview, revenue_by_month, appointments_status, top_services } = data;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">

            {/* ЗАГОЛОВОК */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Аналітика клініки</h1>
                    <p className="text-gray-500 mt-1">Фінансові показники та статистика прийомів</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100/80 p-1 rounded-xl">
                        <button
                            onClick={() => setPeriod('weekly')}
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${period === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Тиждень
                        </button>
                        <button
                            onClick={() => setPeriod('monthly')}
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${period === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Місяць
                        </button>
                        <button
                            onClick={() => setPeriod('all_time')}
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${period === 'all_time' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Весь час
                        </button>
                    </div>

                    {/* Кнопка завантаження PDF */}
                    <button
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2 bg-dental-600 text-white text-sm font-bold rounded-xl hover:bg-dental-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-dental-200"
                    >
                        {downloading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Download size={18} />
                        )}
                        Звіт (PDF)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 z-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={28} />
                    </div>
                    <div className="z-10">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Прибуток</p>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(overview.total_revenue)}</p>
                        <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-1">
                            <TrendingUp size={12} /> +{formatCurrency(overview.revenue_for_period)} за період
                        </p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50 z-0"><DollarSign size={100} /></div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Пацієнти</p>
                        <p className="text-2xl font-black text-gray-900">{overview.total_patients}</p>
                        <p className="text-xs font-bold text-blue-500 mt-1">+{overview.new_patients} за період</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Stethoscope size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Лікарі</p>
                        <p className="text-2xl font-black text-gray-900">{overview.total_doctors}</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">Всього у штаті</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Записи</p>
                        <p className="text-2xl font-black text-gray-900">{overview.total_appointments}</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">За весь час</p>
                    </div>
                </div>
            </div>

            {/* ГРАФІКИ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ГРАФІК ПРИБУТКУ */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Динаміка прибутку</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenue_by_month} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip
                                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Прибуток']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="Прибуток" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* СТАТУСИ ЗАПИСІВ (КРУГОВА ДІАГРАМА) */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Статуси прийомів</h2>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        {appointments_status.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={appointments_status}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {appointments_status.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-400 text-sm">Немає даних за цей період</p>
                        )}
                    </div>
                </div>

                {/* ТОП ПОСЛУГ (БАР ЧАРТ) */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm lg:col-span-3">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Топ найпопулярніших послуг</h2>
                    <div className="h-[300px] w-full">
                        {top_services.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={top_services} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', width: 140 }} width={150} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="Кількість" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24}>
                                        {top_services.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-gray-400 text-sm">Немає оплат за послуги</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminStatisticsPage;