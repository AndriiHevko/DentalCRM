import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '../services/api';
import { Eye, EyeOff } from 'lucide-react'; // Якщо використовуєш ці іконки

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const uidb64 = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!uidb64 || !token) {
      setError("Недійсне посилання для відновлення паролю. Відсутні необхідні параметри.");
    }
  }, [uidb64, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uidb64 || !token) return;

    if (form.newPassword !== form.confirmPassword) {
      setError("Паролі не співпадають!");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Пароль повинен містити мінімум 8 символів.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmPasswordReset({
        uidb64,
        token,
        new_password: form.newPassword
      });

      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);

    } catch (err: any) {
      setError(err.message || 'Помилка скидання пароля');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dental-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Пароль змінено!</h2>
          <p className="text-gray-600 mb-6">Ваш пароль успішно оновлено. Тепер ви можете увійти в систему.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Перейти до входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dental-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2 text-dental-600">
          Новий пароль
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6 font-medium">
          Будь ласка, введіть новий пароль для вашого акаунту.
        </p>

        {error ? (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
            {error}
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Новий пароль</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500"
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Підтвердіть пароль</label>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition-all mt-6 disabled:opacity-70"
            >
              {loading ? 'Збереження...' : 'Зберегти пароль'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;