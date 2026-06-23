import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../../types';
import { fetchAllInvoices, fetchStatistics } from '../../services/api';
import { InvoiceTable } from '../../components/admin/InvoiceTable';
import { FileText, TrendingUp } from 'lucide-react';

const TOKEN_KEY = 'dental_clinic_tokens';

export const InvoicesAdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    
    const [totalPaid, setTotalPaid] = useState<number>(0);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            const saved = localStorage.getItem(TOKEN_KEY);
            if (!saved) {
                navigate('/login');
                return;
            }

            try {
                const { access } = JSON.parse(saved);
                setLoading(true);
                
                const [invoicesData, statsData] = await Promise.all([
                    fetchAllInvoices(access),
                    fetchStatistics(access, 'all_time')
                ]);
                
                setInvoices(invoicesData);
                
                if (statsData && statsData.overview) {
                    setTotalPaid(statsData.overview.total_revenue);
                } else {
                    const localTotal = (Array.isArray(invoicesData) ? invoicesData : [])
                        .filter((inv: Invoice) => inv.status === 'paid')
                        .reduce((sum: number, inv: Invoice) => sum + Number(inv.total_amount), 0);
                    setTotalPaid(localTotal);
                }

            } catch (err: any) {
                setError(err.message || 'Не вдалося завантажити чеки');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Заголовок та швидка статистика */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-dental-600 text-white rounded-xl flex items-center justify-center shadow-md">
                            <FileText size={24} />
                        </div>
                        Фінанси та Чеки
                    </h1>
                    <p className="text-gray-500 mt-2 ml-1">
                        Керування згенерованими квитанціями та огляд доходів.
                    </p>
                </div>

                {!loading && (
                    <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Оплачено загалом</p>
                            <p className="text-2xl font-black text-gray-900">{totalPaid.toLocaleString('uk-UA')} ₴</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
                    {error}
                </div>
            )}

            <InvoiceTable invoices={invoices} isLoading={loading} />
        </div>
    );
};