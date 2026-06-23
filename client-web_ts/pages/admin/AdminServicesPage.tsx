import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ServiceItem, UserProfile } from '../../types';
import { fetchServices, fetchSpecialties, createService, updateService, deleteService } from '../../services/api';
import { Plus, X, Edit, Trash2, Clock, DollarSign, Activity, Image as ImageIcon } from 'lucide-react';

interface AdminContext { token: string; userProfile: UserProfile; }

const AdminServicesPage: React.FC = () => {
    const { token } = useOutletContext<AdminContext>();
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [specialties, setSpecialties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [serviceForm, setServiceForm] = useState({
        id: null as number | null,
        name: '',
        description: '',
        price: 0,
        duration_minutes: 30,
        specialty_id: '',
        image_url: '',
        image_file: null as File | null
    });

    const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [servicesData, specsData] = await Promise.all([
                fetchServices(),
                fetchSpecialties()
            ]);
            setServices(servicesData);
            setSpecialties(specsData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const openAddModal = () => {
        setServiceForm({ id: null, name: '', description: '', price: 0, duration_minutes: 30, specialty_id: '', image_url: '', image_file: null });
        setFormErrors({});
        setIsFormModalOpen(true);
    };

    const openEditModal = (service: ServiceItem) => {
        const specialtyObj = specialties.find(s => s.name === service.specialty);

        setServiceForm({
            id: service.id,
            name: service.name,
            description: service.description || '',
            price: service.price,
            duration_minutes: service.duration_minutes,
            specialty_id: specialtyObj ? specialtyObj.id.toString() : '',
            image_url: service.image_url || '',
            image_file: null
        });
        setFormErrors({});
        setIsFormModalOpen(true);
    };

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;
        setIsDeleting(true);
        try {
            await deleteService(serviceToDelete.id, token);
            setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
            setServiceToDelete(null);
        } catch (err: any) {
            alert(err.message || 'Помилка при видаленні послуги');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};
        if (!serviceForm.name.trim() || serviceForm.name.trim().length < 3) errors.name = "Введіть назву (мінімум 3 символи).";
        if (serviceForm.price < 0 || isNaN(serviceForm.price)) errors.price = "Ціна не може бути від'ємною.";
        if (serviceForm.duration_minutes <= 0 || isNaN(serviceForm.duration_minutes)) errors.duration_minutes = "Тривалість має бути більше 0.";
        if (serviceForm.image_url && !/^https?:\/\/.+/.test(serviceForm.image_url)) errors.image_url = "Посилання має починатися з http:// або https://";

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsSubmitting(true);
        try {
            let finalPayload: any;

            if (serviceForm.image_file) {
                const formData = new FormData();
                formData.append('name', serviceForm.name);
                formData.append('description', serviceForm.description);
                formData.append('price', serviceForm.price.toString());
                formData.append('duration_minutes', serviceForm.duration_minutes.toString());
                if (serviceForm.specialty_id) formData.append('specialty_id', serviceForm.specialty_id);

                formData.append('image', serviceForm.image_file); // Відправляємо сам файл
                if (serviceForm.image_url) formData.append('image_url', serviceForm.image_url);

                finalPayload = formData;
            } else {
                finalPayload = { ...serviceForm };
                delete finalPayload.image_file;
                if (!finalPayload.image_url) delete finalPayload.image_url;
            }

            if (serviceForm.id) {
                await updateService(serviceForm.id, token, finalPayload);
            } else {
                await createService(token, finalPayload);
            }

            setIsFormModalOpen(false);
            loadData();
        } catch (err: any) {
            alert(err.message || "Сталася помилка при збереженні.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <style>{`
                .hide-arrows::-webkit-scrollbar {
                    width: 14px !important;
                }
                .hide-arrows::-webkit-scrollbar-track {
                    background: transparent !important;
                    margin: 20px 0 !important;
                }
                .hide-arrows::-webkit-scrollbar-thumb {
                    background-color: #d1d5db !important;
                    border-radius: 9999px !important;
                    border: 4px solid white !important;
                    background-clip: padding-box !important;
                }
                .hide-arrows::-webkit-scrollbar-thumb:hover {
                    background-color: #9ca3af !important;
                    border: 4px solid white !important;
                    background-clip: padding-box !important;
                }
                .hide-arrows::-webkit-scrollbar-button {
                    width: 0px !important;
                    height: 0px !important;
                    display: none !important;
                }
            `}</style>

            {/* Основний контент */}
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Послуги клініки</h1>
                        <p className="text-gray-500 mt-1">Управління прайсом, описом та тривалістю процедур</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-5 py-3 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={20} /> Додати послугу
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div></div>
                    ) : services.map(service => (
                        <div key={service.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col relative">

                            <div className="absolute top-4 right-4 flex items-center gap-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setServiceToDelete(service)}
                                    className="p-2 text-white hover:text-red-500 bg-gray-900/40 hover:bg-white backdrop-blur-md rounded-lg transition-colors shadow-sm"
                                    title="Видалити"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => openEditModal(service)}
                                    className="p-2 text-white hover:text-dental-600 bg-gray-900/40 hover:bg-white backdrop-blur-md rounded-lg transition-colors shadow-sm"
                                    title="Редагувати"
                                >
                                    <Edit size={18} />
                                </button>
                            </div>

                            <div className="h-48 w-full bg-gray-100 relative">
                                {service.image || service.image_url ? (
                                    <img src={service.image || service.image_url} alt={service.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <ImageIcon size={32} opacity={0.5} />
                                        <span className="text-xs font-medium">Немає фото</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <div className="mb-2">
                                    <span className="px-2 py-1 bg-dental-50 text-dental-600 text-[10px] font-black uppercase rounded-md border border-dental-100 inline-block mb-2">
                                        {service.specialty || 'Загальна'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-dental-600 transition-colors">{service.name}</h3>
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                    {service.description || 'Опис відсутній'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center gap-1.5 text-gray-700">
                                        <Clock size={16} className="text-dental-500" />
                                        <span className="text-sm font-bold">{service.duration_minutes} хв</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-900">
                                        <span className="text-lg font-black">{service.price}</span>
                                        <span className="text-sm font-bold text-gray-500">грн</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ОСНОВНА МОДАЛКА РЕДАГУВАННЯ / СТВОРЕННЯ */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
                    <div className="hide-arrows bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">

                        <button onClick={() => setIsFormModalOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10">
                            <X size={18} />
                        </button>

                        <div className="pr-10 mb-5 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1">{serviceForm.id ? 'Редагування послуги' : 'Створення послуги'}</h2>
                            <p className="text-xs sm:text-sm text-gray-500">Налаштуйте параметри процедури для відображення в прайсі.</p>
                        </div>

                        <form onSubmit={handleSaveService} className="space-y-4" noValidate>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Назва послуги</label>
                                    <input
                                        type="text"
                                        value={serviceForm.name}
                                        onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                                        className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`}
                                        placeholder="Наприклад: Встановлення імплантату"
                                    />
                                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Опис (необов'язково)</label>
                                    <textarea
                                        rows={3}
                                        value={serviceForm.description}
                                        onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                                        className="w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 border-gray-200 focus:ring-dental-500 resize-none"
                                        placeholder="Деталі проведення процедури..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Ціна (грн)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={serviceForm.price || ''}
                                        onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                                        className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`}
                                    />
                                    {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Тривалість (хвилин)</label>
                                    <input
                                        type="number"
                                        min="5" step="5"
                                        value={serviceForm.duration_minutes || ''}
                                        onChange={e => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 0 })}
                                        className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.duration_minutes ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`}
                                    />
                                    {formErrors.duration_minutes && <p className="text-red-500 text-xs mt-1">{formErrors.duration_minutes}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Категорія (Спеціальність)</label>
                                    <select
                                        value={serviceForm.specialty_id}
                                        onChange={e => setServiceForm({ ...serviceForm, specialty_id: e.target.value })}
                                        className="w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 border-gray-200 focus:ring-dental-500"
                                    >
                                        <option value="">Без категорії</option>
                                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Фото послуги (URL або завантаження файлу)</label>
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        <div className="flex-1 w-full space-y-3">
                                            <div>
                                                <input
                                                    type="url"
                                                    placeholder="https://example.com/photo.jpg"
                                                    value={serviceForm.image_url}
                                                    onChange={e => {
                                                        setServiceForm({ ...serviceForm, image_url: e.target.value, image_file: null });
                                                        if (formErrors.image_url) setFormErrors({ ...formErrors, image_url: '' });
                                                    }}
                                                    className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 text-sm ${formErrors.image_url ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`}
                                                />
                                                {formErrors.image_url && <p className="text-red-500 text-xs mt-1">{formErrors.image_url}</p>}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <hr className="flex-1 border-gray-200" />
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Або файл</span>
                                                <hr className="flex-1 border-gray-200" />
                                            </div>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files?.[0] || null;
                                                    if (file) {
                                                        setServiceForm({ ...serviceForm, image_file: file, image_url: '' });
                                                        if (formErrors.image_url) setFormErrors({ ...formErrors, image_url: '' });
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-dental-100 file:text-dental-700 hover:file:bg-dental-200 cursor-pointer"
                                            />
                                        </div>

                                        {(serviceForm.image_url || serviceForm.image_file) && (
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                                                <img
                                                    src={serviceForm.image_file ? URL.createObjectURL(serviceForm.image_file) : serviceForm.image_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors">Скасувати</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 text-sm sm:text-base bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Збереження...' : (serviceForm.id ? 'Зберегти зміни' : 'Створити послугу')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* МОДАЛКА ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ */}
            {serviceToDelete && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
                    {/* ДОДАНО КЛАС hide-arrows */}
                    <div className="hide-arrows bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">

                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Видалити послугу?</h3>
                        <p className="text-gray-500 text-xs sm:text-sm mb-8">
                            Ви впевнені, що хочете видалити послугу <b>{serviceToDelete.name}</b>?
                            Цю дію неможливо буде скасувати.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setServiceToDelete(null)}
                                className="flex-1 py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleDeleteService}
                                disabled={isDeleting}
                                className="flex-1 py-3 text-sm sm:text-base bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
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

export default AdminServicesPage;