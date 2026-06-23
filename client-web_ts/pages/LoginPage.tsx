import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, requestPasswordReset, verifyEmail } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const TOKEN_KEY = 'dental_clinic_tokens';

const LoginPage: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', email: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const navigate = useNavigate();

  const handleAuthSuccess = (tokens: any) => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    try {
      const payloadBase64 = tokens.access.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      if (decodedPayload.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/cabinet');
      }
    } catch (e) {
      navigate('/cabinet');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showRegister && form.password !== form.confirmPassword) {
      setError("Паролі не співпадають!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (showRegister) {
        const { confirmPassword, username, ...registerData } = form;
        await registerUser(registerData);
        setShowVerification(true);
        setLoading(false);
        return;
      }

      const loginIdentifier = showRegister ? form.phone : form.username;
      const tokens = await loginUser(loginIdentifier, form.password);
      handleAuthSuccess(tokens);
    } catch (err: any) {
      setError(showRegister ? err.message : 'Невірний логін або пароль!');
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    setLoading(true);
    setError(null);
    try {
      await verifyEmail(form.email, verificationCode);
      const tokens = await loginUser(form.phone, form.password);
      handleAuthSuccess(tokens);
    } catch (err: any) {
      setError(err.message || 'Помилка підтвердження');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setForgotMsg(null);
    try {
      await requestPasswordReset(forgotEmail);
      setForgotMsg({ type: 'success', text: 'Інструкція для скидання відправлена на ваш email!' });
    } catch (err: any) {
      setForgotMsg({ type: 'error', text: err.message || 'Помилка скидання пароля' });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dental-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl relative animate-in fade-in zoom-in duration-300 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📧</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Відновлення доступу</h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">Введіть ваш Email, і ми надішлемо вам посилання для зміни паролю.</p>

          {forgotMsg && (
            <div className={`p-4 rounded-xl border mb-6 text-sm font-medium ${forgotMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              {forgotMsg.type === 'success' ? '✅ ' : '❌ '} {forgotMsg.text}
            </div>
          )}

          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-bold text-gray-700 mb-2">Ваш Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-gray-800"
                placeholder="mail@example.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-6 disabled:opacity-70"
            >
              {loading ? 'Надсилання...' : 'Відправити посилання'}
            </button>
          </form>

          <button
            onClick={() => { setShowForgotPassword(false); setForgotMsg(null); }}
            className="mt-6 text-sm font-bold text-gray-400 hover:text-dental-600 transition-colors"
          >
            Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  // Підтвердження пошти
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dental-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl relative animate-in fade-in zoom-in duration-300 text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🛡️</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Підтвердження Email</h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Ми надіслали код підтвердження на адресу <span className="font-bold text-gray-700">{form.email}</span>. Введіть його нижче.
          </p>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-4">{error}</div>}

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-bold text-gray-700 mb-2">Код підтвердження</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-dental-500 bg-gray-50/50 hover:bg-gray-50 transition-colors font-medium text-center text-xl tracking-widest text-gray-800"
                placeholder="000000"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                required
                maxLength={6}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-6 disabled:opacity-70"
            >
              {loading ? 'Перевірка...' : 'Підтвердити та увійти'}
            </button>
          </form>

          <button
            onClick={() => { setShowVerification(false); setShowRegister(false); setError(null); }}
            className="mt-6 text-sm font-bold text-gray-400 hover:text-dental-600 transition-colors"
          >
            Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dental-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl relative animate-in fade-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-center mb-6 text-dental-600">
          {showRegister ? 'Реєстрація' : 'Вхід'}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!showRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Телефон або Email</label>
              <input
                type="text"
                name="username"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500"
                placeholder="Email або Телефон"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
          )}

          {showRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ім'я</label>
                  <input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Прізвище</label>
                  <input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Телефон</label>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" placeholder="+380..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" />
              </div>
            </>
          )}

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Пароль</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500"
              placeholder="Пароль"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {showRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Підтвердіть пароль</label>
              <input required type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" />
            </div>
          )}

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition-all mt-4"
          >
            {loading ? 'Зачекайте...' : (showRegister ? 'Зареєструватись' : 'Увійти')}
          </button>
        </form>

        {!showRegister && (
          <div className="text-right mt-3">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm font-bold text-gray-400 hover:text-dental-600 transition-colors"
            >
              Забули пароль?
            </button>
          </div>
        )}

        <div className="text-center mt-5">
          {showRegister ? (
            <span className="text-sm font-medium">Вже маєте акаунт?{' '}
              <button
                type="button"
                onClick={() => { setShowRegister(false); setError(null); }}
                className="text-dental-600 hover:text-dental-800 hover:underline"
              >Увійти</button>
            </span>
          ) : (
            <span className="text-sm font-medium">Немає акаунта?{' '}
              <button
                type="button"
                onClick={() => { setShowRegister(true); setError(null); }}
                className="text-dental-600 hover:text-dental-800 hover:underline"
              >Зареєструватись</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;