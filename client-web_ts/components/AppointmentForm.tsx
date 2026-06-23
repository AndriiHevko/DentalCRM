import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Eye, EyeOff, UserCheck, ArrowRight } from 'lucide-react';
import { AppointmentData, Doctor, ServiceItem } from '../types';
import { 
  createAppointment, 
  fetchDoctors, 
  fetchDoctorAvailability, 
  fetchServices, 
  loginUser, 
  registerUser, 
  verifyEmail 
} from '../services/api';

const AuthModal: React.FC<{
  onSuccess: (token: string) => void;
  onClose: () => void;
}> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showVerification, setShowVerification] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', first_name: '', last_name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const finishAuth = (tokens: any) => {
    localStorage.setItem('dental_clinic_tokens', JSON.stringify(tokens));
    window.dispatchEvent(new Event('storage'));
    setTempToken(tokens.access);
    setIsSuccess(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError("Паролі не співпадають!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const { confirmPassword, username, ...registerData } = form;
        await registerUser(registerData);
        setShowVerification(true);
        setLoading(false);
        return;
      }
      
      const tokens = await loginUser(form.username, form.password);
      finishAuth(tokens);
    } catch (err: any) {
      setError(mode === 'register' ? err.message : 'Невірний логін або пароль чи акаунт не підтверджено!');
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
      finishAuth(tokens);
    } catch (err: any) {
      setError(err.message || 'Помилка підтвердження');
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-green-50">
            <UserCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Успішно!</h2>
          <p className="text-gray-600 mb-8 font-medium">
            Ви успішно увійшли/зареєструвались, можете продовжувати робити запис
          </p>
          <button
            onClick={() => {
              if (tempToken) onSuccess(tempToken);
            }}
            className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            Продовжити запис
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 text-center">
          <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors">✕</button>
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🛡️</div>
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
            onClick={() => { setShowVerification(false); setMode('login'); setError(null); }}
            className="mt-6 text-sm font-bold text-gray-400 hover:text-dental-600 transition-colors"
          >
            Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors">
          ✕
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {mode === 'login' ? 'Увійдіть для запису' : 'Створення акаунта'}
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Після входу ви зможете перевірити дані і натиснути «Записатись».
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Телефон або Email</label>
              <input required name="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" placeholder="+380... або email@example.com" />
            </div>
          )}
          {mode === 'register' && (
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
            <input required type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Підтвердіть пароль</label>
              <input required type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2 mt-1 focus:ring-dental-500 focus:border-dental-500" />
            </div>
          )}

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

          <button disabled={loading} type="submit" className="w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition-all mt-4">
            {loading ? 'Зачекайте...' : (mode === 'login' ? 'Увійти' : 'Зареєструватись')}
          </button>
        </form>

        <div className="text-center mt-5">
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} className="text-sm font-medium text-dental-600 hover:text-dental-800 hover:underline">
            {mode === 'login' ? 'Немає акаунту? Реєстрація' : 'Вже маєте акаунт? Увійти'}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm font-medium text-gray-500 mb-3">Не хочете реєструватись?</p>
          <a href="tel:+380991234567" className="inline-flex items-center justify-center w-full bg-green-50 text-green-700 font-bold px-4 py-3 rounded-xl hover:bg-green-100 transition-colors border border-green-200">
            📞 Зателефонуйте нам: +380 99 123 45 67
          </a>
        </div>
      </div>
    </div>
  );
};

interface AppointmentFormProps {
  onSuccess?: () => void;
  isInCabinet?: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSuccess, isInCabinet }) => {
  const [formData, setFormData] = useState<AppointmentData>({
    date: '',
    time: '',
    service_id: undefined,
    notes: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    localStorage.removeItem('dental_clinic_pending_appointment');

    const savedTokens = localStorage.getItem('dental_clinic_tokens');
    if (savedTokens) {
      try {
        const parsed = JSON.parse(savedTokens);
        setToken(parsed.access);
      } catch (e) { }
    }

    const pendingJson = sessionStorage.getItem('dental_clinic_pending_appointment');
    if (pendingJson) {
      try {
        const pendingData = JSON.parse(pendingJson);
        setFormData(pendingData);
      } catch (e) { }
      sessionStorage.removeItem('dental_clinic_pending_appointment');
    }
  }, []);

  useEffect(() => {
    fetchDoctors().then(setDoctors).catch(console.error);
    fetchServices().then(setServices).catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.doctor_id && formData.date && formData.service_id) {
      setIsLoadingSlots(true);
      setFormData(prev => ({ ...prev, time: '' }));
      fetchDoctorAvailability(formData.doctor_id, formData.date, formData.service_id)
        .then(setAvailableSlots)
        .catch(err => {
          console.error('Failed to load slots', err);
          setAvailableSlots([]);
        })
        .finally(() => setIsLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [formData.doctor_id, formData.date, formData.service_id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.time) {
      setError("Будь ласка, оберіть час прийому зі списку вільних годин.");
      return;
    }

    if (!token) {
      sessionStorage.setItem('dental_clinic_pending_appointment', JSON.stringify(formData));
      setShowAuthModal(true);
      return;
    }

    await executeSubmission(token);
  };

  const executeSubmission = async (authToken: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        doctor: formData.doctor_id!,
        service: formData.service_id!,
        appointment_datetime: `${formData.date}T${formData.time}:00`,
        notes: formData.notes
      };
      await createAppointment(payload, authToken);
      setIsSubmitted(true);
      setFormData({ date: '', time: '', service_id: undefined, notes: '' });
      sessionStorage.removeItem('dental_clinic_pending_appointment');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError("Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте адміністратору.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
    setShowAuthModal(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const localNow = new Date();
  const tzOffset = localNow.getTimezoneOffset() * 60000;
  const todayLocalISO = new Date(localNow.getTime() - tzOffset).toISOString().split('T')[0];

  const validSlots = availableSlots.filter(slot => {
    if (formData.date !== todayLocalISO) return true;
    const checkTime = new Date();
    checkTime.setMinutes(checkTime.getMinutes() + 45); 
    return slot >= `${String(checkTime.getHours()).padStart(2, '0')}:${String(checkTime.getMinutes()).padStart(2, '0')}`;
  });

  return (
    <section id="appointment" className={`py-12 ${isInCabinet ? 'mb-2' : 'py-20 bg-dental-50'} relative`}>
      {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} />}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row`}>

          {!isInCabinet && (
            <div className="md:w-5/12 bg-dental-600 p-10 text-white flex flex-col justify-center">
              <h3 className="text-3xl font-bold mb-4">Запишіться на прийом</h3>
              <p className="mb-8 text-dental-100 leading-relaxed">
                Оберіть послугу, лікаря та зручний для вас час. Ваша посмішка — наш пріоритет.
              </p>
              
              {token ? (
                <div className="bg-white/10 border border-white/20 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-dental-900 shadow-inner">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-white">Ви авторизовані</p>
                    <p className="text-dental-200 text-sm">Можете завершувати запис</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-dental-500/50 flex items-center justify-center border border-dental-400">
                      <span className="font-bold">1</span>
                    </div>
                    <span className="text-lg font-medium">Оберіть послугу та лікаря</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-dental-500/50 flex items-center justify-center border border-dental-400">
                      <span className="font-bold">2</span>
                    </div>
                    <span className="text-lg font-medium">Оберіть зручний час</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-dental-500/50 flex items-center justify-center border border-dental-400">
                      <span className="font-bold">3</span>
                    </div>
                    <span className="text-lg font-medium">Підтвердіть запис</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`md:w-${isInCabinet ? 'full' : '7/12'} p-8 sm:p-10`}>
            {isSubmitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-sm border-4 border-green-50">
                  <CheckCircle size={48} />
                </div>
                <h4 className="text-3xl font-bold text-gray-900 mb-3">Запис створено!</h4>
                <p className="text-gray-600 text-lg">
                  Дякуємо за довіру. Ми чекаємо на вас у нашій клініці.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-8 px-6 py-3 bg-dental-50 text-dental-700 font-bold rounded-xl hover:bg-dental-100 transition-colors"
                >
                  Створити ще один запис
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Лікар</label>
                    <select
                      required
                      name="doctor_id"
                      value={formData.doctor_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, doctor_id: parseInt(e.target.value) || undefined }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition-all bg-gray-50"
                    >
                      <option value="">Оберіть лікаря</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name} {d.specialty ? `(${d.specialty.name})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Послуга</label>
                    <select
                      required
                      name="service_id"
                      value={formData.service_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, service_id: parseInt(e.target.value) || undefined }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition-all bg-gray-50"
                    >
                      <option value="">Оберіть послугу</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - {s.price}₴</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Бажана дата</label>
                  <input
                    required
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition-all bg-gray-50"
                    min={todayLocalISO}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Опишіть вашу проблему (необов'язково)</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-dental-500 focus:border-transparent outline-none transition-all resize-none bg-gray-50"
                    placeholder="Наприклад: турбує біль у нижньому лівому зубі..."
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-800 mb-4">Оберіть час прийому</label>
                  {!formData.doctor_id || !formData.date || !formData.service_id ? (
                    <div className="bg-amber-50 text-amber-700 px-5 py-4 rounded-xl border border-amber-100 font-medium text-sm">
                      💡 Оберіть лікаря, послугу та дату, щоб побачити вільні слоти
                    </div>
                  ) : isLoadingSlots ? (
                    <div className="bg-gray-50 text-gray-500 px-5 py-4 rounded-xl border border-gray-200 font-medium text-sm animate-pulse">
                      Завантаження вільних годин...
                    </div>
                  ) : validSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {validSlots.map(slot => {
                        const timeStr = slot.substring(0, 5);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, time: timeStr }))}
                            className={`py-3 px-2 text-sm rounded-xl border font-bold transition-all ${formData.time === timeStr
                              ? 'bg-dental-600 text-white border-dental-600 shadow-md transform -translate-y-0.5'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-dental-400 hover:bg-dental-50'
                              }`}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 font-medium">
                      ❌ На обрану дату немає вільних слотів. Оберіть іншу дату або лікаря.
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.time}
                  className="w-full bg-dental-600 hover:bg-dental-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mt-2"
                >
                  <Calendar size={20} />
                  {isSubmitting ? 'Обробка...' : (token ? 'Підтвердити запис' : 'Увійти та записатись')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentForm;