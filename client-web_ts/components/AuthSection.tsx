import React, { useEffect, useState } from 'react';
import { AuthTokens, UserProfile } from '../types';
import { fetchProfile, login, register } from '../services/authApi';

type Mode = 'login' | 'register';

const STORAGE_KEY = 'dental_clinic_tokens';

const AuthSection: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AuthTokens;
      setTokens(parsed);
      fetchProfileSafe(parsed.access);
    }
  }, []);

  const fetchProfileSafe = async (token: string) => {
    try {
      const data = await fetchProfile(token);
      setProfile(data);
    } catch (err) {
      console.error(err);
      setProfile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        await register({
          username: form.username,
          password: form.password,
          email: form.email,
          phone: form.phone,
          first_name: form.first_name,
          last_name: form.last_name,
        });
        // Auto-login піся реєстрації
        const tk = await login(form.username, form.password);
        setTokens(tk);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tk));
        await fetchProfileSafe(tk.access);
      } else {
        const tk = await login(form.username, form.password);
        setTokens(tk);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tk));
        await fetchProfileSafe(tk.access);
      }
      setForm({ username: '', password: '', email: '', phone: '', first_name: '', last_name: '' });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Помилка авторизації');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setTokens(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section id="account" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-gray-50 rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Особистий кабінет</h2>
              <p className="text-gray-600 text-sm">Реєстрація, вхід та профіль пацієнта</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('login')}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${mode === 'login' ? 'bg-dental-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
              >
                Вхід
              </button>
              <button
                onClick={() => setMode('register')}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${mode === 'register' ? 'bg-dental-600 text-white' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
              >
                Реєстрація
              </button>
            </div>
          </div>

          {tokens && profile ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-gray-500">Ви увійшли як</p>
                  <h3 className="text-xl font-semibold text-gray-900">{profile.username}</h3>
                  {profile.email && <p className="text-gray-700 text-sm mt-1">{profile.email}</p>}
                  {profile.phone && <p className="text-gray-700 text-sm">{profile.phone}</p>}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Вийти
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Токен зберігається у браузері (localStorage). Для продуктивного середовища варто додати refresh-цикл та відкликання токенів.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Логін *</label>
                  <input
                    required
                    name="username"
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Пароль *</label>
                  <input
                    required
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Ім'я</label>
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Прізвище</label>
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Телефон</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-dental-600 text-white font-semibold shadow hover:bg-dental-700 disabled:opacity-70"
                >
                  {loading ? 'Зачекайте...' : mode === 'login' ? 'Увійти' : 'Зареєструватися'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthSection;





