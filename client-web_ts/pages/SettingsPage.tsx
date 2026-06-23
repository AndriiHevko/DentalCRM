import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile, changePassword } from '../services/api';
import { Save } from 'lucide-react';

interface SettingsPageProps {
    token: string;
    initialProfile: UserProfile | null;
    onProfileUpdated: (updatedProfile: UserProfile) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ token, initialProfile, onProfileUpdated }) => {
    // Стан для форми профілю
    const [profileFormData, setProfileFormData] = useState<Partial<UserProfile>>({});
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Стан для зміни пароля
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordFormData, setPasswordFormData] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (initialProfile) {
            setProfileFormData({
                first_name: initialProfile.first_name || '',
                last_name: initialProfile.last_name || '',
                email: initialProfile.email || '',
                date_of_birth: initialProfile.date_of_birth || '',
                gender: initialProfile.gender || null,
                address: initialProfile.address || ''
            });
        }
    }, [initialProfile]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const updated = await updateUserProfile(token, profileFormData);
            onProfileUpdated(updated);
            setSuccessMsg('Профіль успішно оновлено!');
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setErrorMsg(err.message || 'Не вдалося оновити профіль');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordFormData.new_password !== passwordFormData.confirm_password) {
            setPasswordError('Новий пароль та підтвердження не збігаються');
            return;
        }
        if (passwordFormData.new_password.length < 8) {
            setPasswordError('Пароль повинен містити щонайменше 8 символів');
            return;
        }

        setIsUpdatingPassword(true);
        setPasswordError(null);
        setPasswordSuccessMsg(null);
        try {
            await changePassword(token, {
                old_password: passwordFormData.old_password,
                new_password: passwordFormData.new_password
            });
            setPasswordSuccessMsg('Пароль успішно змінено!');
            setPasswordFormData({ old_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => {
                setPasswordSuccessMsg(null);
                setIsPasswordModalOpen(false);
            }, 2000);
        } catch (err: any) {
            setPasswordError(err.message || 'Помилка зміни паролю');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300">
            <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">⚙️</div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">Налаштування профілю</h3>
                        <p className="text-sm text-gray-500">Особисті дані, контакти та загальна інформація</p>
                    </div>
                </div>

                {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 mb-6 flex items-center gap-2 font-medium"><span>✅</span> {successMsg}</div>}
                {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 mb-6 flex items-center gap-2 font-medium"><span>❌</span> {errorMsg}</div>}

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Ім'я</label>
                            <input type="text" value={profileFormData.first_name || ''} onChange={(e) => setProfileFormData(p => ({ ...p, first_name: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Прізвище</label>
                            <input type="text" value={profileFormData.last_name || ''} onChange={(e) => setProfileFormData(p => ({ ...p, last_name: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email адреса</label>
                            <input type="email" value={profileFormData.email || ''} onChange={(e) => setProfileFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Дата народження</label>
                            <input type="date" value={profileFormData.date_of_birth || ''} onChange={(e) => setProfileFormData(p => ({ ...p, date_of_birth: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Стать</label>
                            <select value={profileFormData.gender || ''} onChange={(e) => setProfileFormData(p => ({ ...p, gender: (e.target.value === '' ? null : e.target.value as 'M' | 'F') }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800">
                                <option value="">Не вказано</option>
                                <option value="M">Чоловіча</option>
                                <option value="F">Жіноча</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Адреса проживання</label>
                            <input type="text" value={profileFormData.address || ''} onChange={(e) => setProfileFormData(p => ({ ...p, address: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800" />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                        <button type="button" onClick={() => setIsPasswordModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-dental-600 bg-dental-50 hover:bg-dental-100 font-bold rounded-xl transition-all"><span>🔒</span> Змінити пароль</button>
                        <button type="submit" disabled={isUpdatingProfile} className="flex items-center gap-2 px-6 py-3 bg-dental-600 hover:bg-dental-700 disabled:opacity-70 text-white font-bold rounded-xl shadow-md transition-all"><Save size={20} />{isUpdatingProfile ? 'Збереження...' : 'Зберегти зміни'}</button>
                    </div>
                </form>
            </section>

            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                        <button onClick={() => setIsPasswordModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full transition-colors">✕</button>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><span className="text-purple-600">🔒</span> Зміна паролю</h3>
                        </div>
                        {passwordSuccessMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 font-medium text-sm">✅ {passwordSuccessMsg}</div>}
                        {passwordError && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-medium text-sm">❌ {passwordError}</div>}
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Старий пароль</label><input type="password" required value={passwordFormData.old_password} onChange={(e) => setPasswordFormData(p => ({ ...p, old_password: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50" /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Новий пароль</label><input type="password" required minLength={8} value={passwordFormData.new_password} onChange={(e) => setPasswordFormData(p => ({ ...p, new_password: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50" /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Підтвердження</label><input type="password" required minLength={8} value={passwordFormData.confirm_password} onChange={(e) => setPasswordFormData(p => ({ ...p, confirm_password: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50" /></div>
                            <div className="pt-4 flex justify-end"><button type="submit" disabled={isUpdatingPassword} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all">{isUpdatingPassword ? 'Оновлення...' : 'Зберегти'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};