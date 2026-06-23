import React, { useEffect, useState } from 'react';
import { X, Phone, Mail, Stethoscope, Award, Calendar } from 'lucide-react';
import { Doctor } from '../types';
import { fetchDoctors } from '../services/api';

const fallbackDoctors: Doctor[] = [
  { id: 1, full_name: "Др. Ім'я Прізвище", specialty: { id: 1, name: 'Стоматолог-хірург', description: '' } },
  { id: 2, full_name: "Др. Ім'я Прізвище", specialty: { id: 2, name: 'Терапевт', description: '' } },
  { id: 3, full_name: "Др. Ім'я Прізвище", specialty: { id: 3, name: 'Ортодонт', description: '' } },
  { id: 4, full_name: "Др. Ім'я Прізвище", specialty: { id: 4, name: 'Дитячий стоматолог', description: '' } },
];

const DoctorModal: React.FC<{ doctor: Doctor; idx: number; onClose: () => void }> = ({ doctor, idx, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header image */}
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          <img
            src={doctor.image || doctor.image_url || doctor.imageUrl || `https://picsum.photos/600/400?random=${idx + 10}`}
            alt={doctor.full_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/40 transition-colors"
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 left-6 text-white">
            <h3 className="text-2xl font-bold">{doctor.full_name}</h3>
            <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1.5">
              <Stethoscope size={14} />
              {doctor.specialty?.name || 'Стоматолог'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {doctor.specialty?.description && (
            <p className="text-gray-600 leading-relaxed text-sm">{doctor.specialty.description}</p>
          )}

          <div className="grid grid-cols-1 gap-3">
            {doctor.experience_years != null && (
              <div className="flex items-center gap-3 bg-dental-50 rounded-xl px-4 py-3">
                <Award size={18} className="text-dental-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Досвід роботи</p>
                  <p className="font-semibold text-gray-800">{doctor.experience_years} років</p>
                </div>
              </div>
            )}
            {doctor.phone && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Phone size={18} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Телефон</p>
                  <a href={`tel:${doctor.phone}`} className="font-semibold text-dental-600 hover:underline">{doctor.phone}</a>
                </div>
              </div>
            )}
            {doctor.email && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Mail size={18} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${doctor.email}`} className="font-semibold text-dental-600 hover:underline">{doctor.email}</a>
                </div>
              </div>
            )}
          </div>

          <a
            href="#appointment"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition-all mt-2"
          >
            <Calendar size={18} />
            Записатись до цього лікаря
          </a>
        </div>
      </div>
    </div>
  );
};

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(fallbackDoctors);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<{ doctor: Doctor; idx: number } | null>(null);

  useEffect(() => {
    fetchDoctors()
      .then((data) => setDoctors(data))
      .catch((err) => {
        console.error('Не вдалося отримати список лікарів, показуємо дефолтні:', err);
        setDoctors(fallbackDoctors);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="doctors" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-3">Наші спеціалісти</h2>
        <p className="text-gray-600 mb-10">Оберіть лікаря за спеціалізацією та досвідом</p>
        {loading && <p className="text-sm text-gray-500 mb-6">Завантажуємо лікарів...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {doctors.map((doctor, idx) => (
            <button
              key={doctor.id ?? idx}
              onClick={() => setSelectedDoctor({ doctor, idx })}
              className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-left group cursor-pointer hover:-translate-y-1"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-200 relative">
                <img
                  src={doctor.image || doctor.image_url || doctor.imageUrl || `https://picsum.photos/400/400?random=${idx + 10}`}
                  alt={doctor.full_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-dental-600/0 group-hover:bg-dental-600/10 transition-colors duration-300 flex items-center justify-center">
                  <span className="bg-white text-dental-600 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                    Детальніше
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-lg">{doctor.full_name}</h3>
              <p className="text-dental-600 text-sm">{doctor.specialty?.name || 'Стоматолог'}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedDoctor && (
        <DoctorModal
          doctor={selectedDoctor.doctor}
          idx={selectedDoctor.idx}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </section>
  );
};

export default Doctors;
