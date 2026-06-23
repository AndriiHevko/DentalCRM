import React, { useState, useMemo } from 'react';
import { Invoice } from '../../types';
import { Download, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoiceTableProps {
    invoices: Invoice[];
    isLoading: boolean;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Фільтрація по імені або телефону
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv =>
            inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.patient_phone.includes(searchTerm)
        );
    }, [invoices, searchTerm]);

    // Пагінація
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Скидання сторінки при пошуку
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">Оплачено</span>;
            case 'unpaid':
                return <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">Неоплачено</span>;
            case 'cancelled':
                return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">Скасовано</span>;
            default:
                return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-dental-100 border-t-dental-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-dental-600" size={20} />
                    Усі фінансові чеки
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                        {filteredInvoices.length}
                    </span>
                </h3>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Пошук за пацієнтом чи тел..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dental-500 focus:bg-white transition-colors w-full sm:w-72"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Дата створення</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Пацієнт</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Сума</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Статус</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Документ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {paginatedInvoices.length > 0 ? (
                            paginatedInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">#{invoice.id}</td>
                                    <td className="py-4 px-6 text-sm text-gray-600">
                                        {new Date(invoice.created_at).toLocaleString('uk-UA', {
                                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-sm font-bold text-gray-900">{invoice.patient_name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{invoice.patient_phone}</div>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-bold text-dental-700">
                                        {invoice.total_amount} ₴
                                    </td>
                                    <td className="py-4 px-6">
                                        {getStatusBadge(invoice.status)}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {invoice.receipt_pdf ? (
                                            <a
                                                href={invoice.receipt_pdf}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-dental-600 hover:border-dental-300 transition-all shadow-sm"
                                            >
                                                <Download size={16} />
                                                PDF
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Немає файлу</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <FileText size={48} className="text-gray-300 mb-3" />
                                        <p className="text-lg font-medium">Чеки не знайдено</p>
                                        {searchTerm && <p className="text-sm mt-1">За запитом "{searchTerm}" нічого немає.</p>}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-medium text-gray-600">
                        Сторінка <span className="font-bold text-gray-900">{currentPage}</span> з {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};