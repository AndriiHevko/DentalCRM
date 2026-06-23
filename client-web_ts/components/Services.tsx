import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Activity, Clock, ShieldCheck, Smile, Drill, X, Calendar } from 'lucide-react';
import { ServiceItem } from '../types';
import { fetchServices } from '../services/api';

const fallbackServices: ServiceItem[] = [
  {
    id: 1,
    name: 'Професійна гігієна',
    description: 'Комплексна чистка зубів Air Flow та ультразвук для ідеальної усмішки.',
    price: 1500,
    duration_minutes: 60,
    specialty: 'Гігієніст',
    image_url: 'https://picsum.photos/seed/service1/600/400'
  },
  {
    id: 2,
    name: 'Лікування карієсу',
    description: 'Безболісне лікування з використанням сучасних фотополімерних матеріалів.',
    price: 1200,
    duration_minutes: 90,
    specialty: 'Терапевт',
    image_url: 'https://picsum.photos/seed/service2/600/400'
  },
  {
    id: 3,
    name: 'Імплантація',
    description: 'Відновлення втрачених зубів за допомогою систем Straumann та Nobel.',
    price: 15000,
    duration_minutes: 120,
    specialty: 'Хірург-імплантолог',
    image_url: 'https://picsum.photos/seed/service3/600/400'
  },
];

const IconList = [Sparkles, Drill, ShieldCheck, Smile, Activity, Clock];

const formatPrice = (price: number) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(price);

const ServiceModal: React.FC<{ service: ServiceItem; idx: number; onClose: () => void }> = ({ service, idx, onClose }) => {
  const Icon = IconList[idx % IconList.length];

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
        <div className="relative h-52 bg-gray-200 overflow-hidden">
          <img
            src={service.image || service.image_url || `https://picsum.photos/seed/service-${service.id}/800/600`}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/40 transition-colors"
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 left-6 text-white">
            <h3 className="text-2xl font-bold">{service.name}</h3>
            {service.specialty && (
              <p className="text-white/75 text-sm mt-0.5">{service.specialty}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 leading-relaxed">{service.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center bg-dental-50 rounded-xl py-4 px-3">
              <Icon size={22} className="text-dental-600 mb-1.5" />
              <p className="text-xs text-gray-500">Вартість</p>
              <p className="text-lg font-bold text-dental-700">{formatPrice(service.price)}</p>
            </div>
            {service.duration_minutes && (
              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl py-4 px-3">
                <Clock size={22} className="text-gray-400 mb-1.5" />
                <p className="text-xs text-gray-500">Тривалість</p>
                <p className="text-lg font-bold text-gray-700">{service.duration_minutes} хв</p>
              </div>
            )}
          </div>

          <a
            href="#appointment"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 rounded-xl transition-all mt-2"
          >
            <Calendar size={18} />
            Записатись на цю послугу
          </a>
        </div>
      </div>
    </div>
  );
};

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(fallbackServices);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<{ service: ServiceItem; idx: number } | null>(null);

  useEffect(() => {
    fetchServices()
      .then((data) => setServices(data))
      .catch((err) => {
        console.error('Не вдалося завантажити послуги, показуємо дефолтні:', err);
        setServices(fallbackServices);
      })
      .finally(() => setLoading(false));
  }, []);

  const listToRender = useMemo(() => services ?? fallbackServices, [services]);

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Наші Послуги</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ми пропонуємо повний спектр стоматологічних послуг, використовуючи найсучасніше обладнання та матеріали.
          </p>
          {loading && <p className="text-sm text-gray-500 mt-2">Завантажуємо послуги...</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listToRender.map((service, idx) => {
            const Icon = IconList[idx % IconList.length];
            return (
              <button
                key={service.id}
                onClick={() => setSelectedService({ service, idx })}
                className="group p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-dental-200 transition-all duration-300 text-left cursor-pointer hover:-translate-y-1"
              >
                <div className="w-full h-44 mb-6 overflow-hidden rounded-xl bg-gray-200 relative">
                  <img
                    src={service.image || service.image_url || `https://picsum.photos/seed/service-${service.id}/800/600`}
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-dental-600/0 group-hover:bg-dental-600/10 transition-colors duration-300 flex items-center justify-center">
                    <span className="bg-white text-dental-600 text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                      Детальніше
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.name}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-sm font-medium text-gray-500">Вартість:</span>
                  <span className="text-lg font-bold text-dental-700">{formatPrice(service.price)}</span>
                </div>
                {service.duration_minutes && (
                  <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
                    <span>Тривалість:</span>
                    <span>{service.duration_minutes} хв</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedService && (
        <ServiceModal
          service={selectedService.service}
          idx={selectedService.idx}
          onClose={() => setSelectedService(null)}
        />
      )}
    </section>
  );
};

export default Services;