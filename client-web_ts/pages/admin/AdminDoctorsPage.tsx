import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Doctor, UserProfile } from '../../types';
import { fetchDoctors, fetchSpecialties, createDoctor, updateDoctor, deleteDoctor } from '../../services/api';
import { ScheduleModal } from '../../components/admin/ScheduleModal';
import { User, Shield, Phone, Mail, Calendar, Plus, X, Briefcase, Edit, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
interface AdminContext { token: string; userProfile: UserProfile; }

const AdminDoctorsPage: React.FC = () => {
    const { token } = useOutletContext<AdminContext>();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [specialties, setSpecialties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [doctorForm, setDoctorForm] = useState({
        id: null as number | null,
        full_name: '',
        phone: '',
        email: '',
        specialty_id: '',
        experience_years: 0,
        password: '',
        image_url: '',
        image_file: null as File | null
    });

    const [passwordModalDoc, setPasswordModalDoc] = useState<Doctor | null>(null);
    const [passForm, setPassForm] = useState({ new: '', repeat: '' });
    const [showPass, setShowPass] = useState({ new: false, repeat: false });
    const [passError, setPassError] = useState('');
    const [isPassSubmitting, setIsPassSubmitting] = useState(false);
    const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsData, specsData] = await Promise.all([
                fetchDoctors(),
                fetchSpecialties()
            ]);
            setDoctors(docsData);
            setSpecialties(specsData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const openAddModal = () => {
        setDoctorForm({ id: null, full_name: '', phone: '', email: '', specialty_id: '', experience_years: 0, password: '', image_url: '', image_file: null });
        setFormErrors({});
        setIsFormModalOpen(true);
    };

    const openEditModal = (doc: Doctor) => {
        setDoctorForm({
            id: doc.id,
            full_name: doc.full_name,
            phone: doc.phone || '',
            email: doc.email || '',
            specialty_id: doc.specialty?.id?.toString() || '',
            experience_years: doc.experience_years || 0,
            password: '',
            image_url: doc.image || doc.image_url || doc.imageUrl || '', 
            image_file: null
        });
        setFormErrors({});
        setIsFormModalOpen(true);
    };

    const openPasswordModal = (doc: Doctor) => {
        setPasswordModalDoc(doc);
        setPassForm({ new: '', repeat: '' });
        setShowPass({ new: false, repeat: false });
        setPassError('');
    };

    const handleDeleteDoctor = async () => {
        if (!doctorToDelete) return;
        setIsDeleting(true);
        try {
            await deleteDoctor(doctorToDelete.id, token);
            setDoctors(prev => prev.filter(d => d.id !== doctorToDelete.id));
            setDoctorToDelete(null);
        } catch (err: any) {
            alert(err.message || 'Помилка при видаленні лікаря');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveDoctor = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};

        if (!doctorForm.full_name.trim() || doctorForm.full_name.trim().length < 3) {
            errors.full_name = "Введіть повне ПІБ (мінімум 3 символи).";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorForm.email.trim())) {
            errors.email = "Введіть коректну електронну адресу.";
        }
        if (!/^\+380\d{9}$/.test(doctorForm.phone.trim())) {
            errors.phone = "Формат телефону має бути: +380XXXXXXXXX";
        }
        if (!doctorForm.specialty_id) {
            errors.specialty_id = "Оберіть спеціальність зі списку.";
        }
        if (doctorForm.experience_years < 0 || isNaN(doctorForm.experience_years)) {
            errors.experience_years = "Досвід не може бути від'ємним.";
        }
        if (!doctorForm.id && doctorForm.password.length < 8) {
            errors.password = "Пароль має містити мінімум 8 символів.";
        }
        if (doctorForm.image_url && !/^https?:\/\/.+/.test(doctorForm.image_url)) {
            errors.image_url = "Посилання має починатися з http:// або https://";
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            let finalPayload: any;

            if (doctorForm.image_file) {
                const formData = new FormData();
                formData.append('full_name', doctorForm.full_name);
                formData.append('phone', doctorForm.phone);
                formData.append('email', doctorForm.email);
                formData.append('specialty_id', doctorForm.specialty_id);
                formData.append('experience_years', doctorForm.experience_years.toString());
                formData.append('image', doctorForm.image_file);
                
                formData.append('image_url', '');

                if (!doctorForm.id && doctorForm.password) {
                    formData.append('password', doctorForm.password);
                }
                finalPayload = formData;
            } else {
                finalPayload = { ...doctorForm };
                delete finalPayload.image_file;

                if (!finalPayload.image_url) {
                    finalPayload.image_url = '';
                    finalPayload.image = null; 
                }
                
                if (finalPayload.id) {
                    delete finalPayload.password;
                }
            }

            if (doctorForm.id) {
                await updateDoctor(doctorForm.id, token, finalPayload);
            } else {
                if (!doctorForm.password) throw new Error("Для нового лікаря пароль обов'язковий");
                await createDoctor(token, finalPayload);
            }

            setIsFormModalOpen(false);
            loadData();
        } catch (err: any) {
            alert(err.message || "Сталася помилка. Перевірте унікальність email/телефону.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');

        if (passForm.new.length < 8) {
            setPassError("Новий пароль має містити мінімум 8 символів.");
            return;
        }
        if (passForm.new !== passForm.repeat) {
            setPassError("Нові паролі не співпадають!");
            return;
        }

        setIsPassSubmitting(true);
        try {
            if (passwordModalDoc) {
                await updateDoctor(passwordModalDoc.id, token, { password: passForm.new });
                setPasswordModalDoc(null);
                alert("Пароль лікаря успішно змінено!");
            }
        } catch (err: any) {
            setPassError("Сталася помилка при збереженні на сервері.");
        } finally {
            setIsPassSubmitting(false);
        }
    };

    const toggleShowPass = (field: 'new' | 'repeat') => {
        setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
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

            {/* Головна сторінка */}
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Лікарі та графік</h1>
                        <p className="text-gray-500 mt-1">Управління персоналом, доступом та графіками роботи</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-5 py-3 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={20} /> Додати лікаря
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div></div>
                    ) : doctors.map(doc => (
                        <div key={doc.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group relative">

                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button onClick={() => setDoctorToDelete(doc)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Видалити лікаря">
                                    <Trash2 size={18} />
                                </button>
                                <button onClick={() => openPasswordModal(doc)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Скинути пароль">
                                    <Key size={18} />
                                </button>
                                <button onClick={() => openEditModal(doc)} className="p-2 text-gray-400 hover:text-dental-600 hover:bg-dental-50 rounded-lg transition-colors" title="Редагувати дані">
                                    <Edit size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                {doc.image || doc.image_url || doc.imageUrl ? (
                                    <img 
                                        src={doc.image || doc.image_url || doc.imageUrl} 
                                        alt={doc.full_name} 
                                        className="w-16 h-16 shrink-0 rounded-2xl object-cover shadow-md border border-gray-100" 
                                    />
                                ) : (
                                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-dental-400 to-dental-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                        {doc.full_name.charAt(0)}
                                    </div>
                                )}
                                <div className="pr-32">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-dental-600 transition-colors leading-snug">
                                        {doc.full_name}
                                    </h3>
                                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-dental-50 text-dental-600 text-[10px] font-black uppercase rounded-md border border-dental-100">
                                        {doc.specialty?.name || 'Лікар'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-gray-600"><Phone size={14} className="text-gray-400" /> {doc.phone}</div>
                                <div className="flex items-center gap-3 text-sm text-gray-600"><Mail size={14} className="text-gray-400" /> {doc.email}</div>
                                <div className="flex items-center gap-3 text-sm text-gray-600"><Briefcase size={14} className="text-gray-400" /> Досвід: {doc.experience_years} р.</div>
                            </div>

                            <button onClick={() => setSelectedDoctor(doc)} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors">
                                <Calendar size={16} /> Графік роботи
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedDoctor && (
                <ScheduleModal
                    doctor={selectedDoctor}
                    token={token}
                    onClose={() => setSelectedDoctor(null)}
                    onSuccess={() => { setSelectedDoctor(null); loadData(); }}
                />
            )}

            {/* ОСНОВНА МОДАЛКА */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
                    <div className="hide-arrows bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
                        <button onClick={() => setIsFormModalOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full transition-colors z-10">
                            <X size={18} />
                        </button>

                        <div className="pr-10 mb-5 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold mb-1">{doctorForm.id ? 'Редагування даних' : 'Реєстрація лікаря'}</h2>
                            <p className="text-xs sm:text-sm text-gray-500">Оновіть особисту та професійну інформацію.</p>
                        </div>

                        <form onSubmit={handleSaveDoctor} className="space-y-4" noValidate>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Повне ПІБ</label>
                                    <input type="text" value={doctorForm.full_name} onChange={e => setDoctorForm({ ...doctorForm, full_name: e.target.value })} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`} />
                                    {formErrors.full_name && <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Електронна адреса (Логін)</label>
                                    <input type="email" value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`} placeholder="kovalenko@clinic.ua" />
                                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Номер телефону</label>
                                    <input type="text" value={doctorForm.phone} onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`} placeholder="+380..." />
                                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Спеціальність</label>
                                    <select value={doctorForm.specialty_id} onChange={e => setDoctorForm({ ...doctorForm, specialty_id: e.target.value })} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.specialty_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`}>
                                        <option value="">Оберіть...</option>
                                        {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    {formErrors.specialty_id && <p className="text-red-500 text-xs mt-1">{formErrors.specialty_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Досвід (років)</label>
                                    <input type="number" min="0" value={doctorForm.experience_years} onChange={e => setDoctorForm({ ...doctorForm, experience_years: parseInt(e.target.value) || 0 })} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.experience_years ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`} />
                                    {formErrors.experience_years && <p className="text-red-500 text-xs mt-1">{formErrors.experience_years}</p>}
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Фото лікаря (URL або завантаження файлу)</label>
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        <div className="flex-1 w-full space-y-3">
                                            <div>
                                                <input type="url" placeholder="https://example.com/photo.jpg" value={doctorForm.image_url} onChange={e => { setDoctorForm({ ...doctorForm, image_url: e.target.value, image_file: null }); if (formErrors.image_url) setFormErrors({ ...formErrors, image_url: '' }); }} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 text-sm ${formErrors.image_url ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`} />
                                                {formErrors.image_url && <p className="text-red-500 text-xs mt-1">{formErrors.image_url}</p>}
                                            </div>
                                            <div className="flex items-center gap-4"><hr className="flex-1 border-gray-200" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Або файл</span><hr className="flex-1 border-gray-200" /></div>
                                            <input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0] || null; if (file) { setDoctorForm({ ...doctorForm, image_file: file, image_url: '' }); if (formErrors.image_url) setFormErrors({ ...formErrors, image_url: '' }); } }} className="w-full px-4 py-2 border rounded-xl bg-gray-50 text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-dental-100 file:text-dental-700 hover:file:bg-dental-200 cursor-pointer" />
                                        </div>
                                        {(doctorForm.image_url || doctorForm.image_file) && (
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                                                <img src={doctorForm.image_file ? URL.createObjectURL(doctorForm.image_file) : doctorForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!doctorForm.id && (
                                    <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                        <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Початковий пароль доступу</label>
                                        <input type="text" value={doctorForm.password} onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })} className={`w-full px-4 py-2.5 sm:py-2 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 ${formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-dental-500'}`} placeholder="Мінімум 8 символів" />
                                        {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors">Скасувати</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 text-sm sm:text-base bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Збереження...' : (doctorForm.id ? 'Зберегти зміни' : 'Зареєструвати лікаря')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* МОДАЛКА ЗМІНИ ПАРОЛЯ */}
            {passwordModalDoc && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
                    <div className="hide-arrows bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
                        <button onClick={() => setPasswordModalDoc(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 w-8 h-8 flex items-center justify-center rounded-full">
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Key size={20} /></div>
                            <h2 className="text-2xl font-bold">Скидання пароля</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Для лікаря: <span className="font-bold text-gray-900">{passwordModalDoc.full_name}</span></p>
                        {passError && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">{passError}</div>}
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Новий пароль</label>
                                <div className="relative">
                                    <input type={showPass.new ? "text" : "password"} required minLength={8} value={passForm.new} onChange={e => setPassForm({ ...passForm, new: e.target.value })} className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-amber-500 pr-10" placeholder="Мінімум 8 символів" />
                                    <button type="button" onClick={() => toggleShowPass('new')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">{showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Повторіть пароль</label>
                                <div className="relative">
                                    <input type={showPass.repeat ? "text" : "password"} required minLength={8} value={passForm.repeat} onChange={e => setPassForm({ ...passForm, repeat: e.target.value })} className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-amber-500 pr-10" />
                                    <button type="button" onClick={() => toggleShowPass('repeat')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">{showPass.repeat ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setPasswordModalDoc(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl transition-colors">Скасувати</button>
                                <button type="submit" disabled={isPassSubmitting} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">{isPassSubmitting ? 'Збереження...' : 'Змінити пароль'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* МОДАЛКА ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ */}
            {doctorToDelete && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
                    <div className="hide-arrows bg-white rounded-2xl md:rounded-3xl p-5 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Видалити лікаря?</h3>
                        <p className="text-gray-500 text-xs sm:text-sm mb-8">
                            Ви впевнені, що хочете видалити <b>{doctorToDelete.full_name}</b>?
                            Цю дію неможливо буде скасувати, і доступ користувача буде також анульовано.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDoctorToDelete(null)} className="flex-1 py-3 text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">Скасувати</button>
                            <button onClick={handleDeleteDoctor} disabled={isDeleting} className="flex-1 py-3 text-sm sm:text-base bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50">
                                {isDeleting ? 'Видалення...' : 'Так, видалити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminDoctorsPage;