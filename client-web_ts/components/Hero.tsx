import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-white pt-24 pb-12 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Content */}
          <div className="lg:w-1/2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dental-50 text-dental-700 font-medium text-sm mb-6 border border-dental-100">
              <span className="w-2 h-2 rounded-full bg-dental-500 animate-pulse"></span>
              Стоматологія майбутнього
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Ваша <span className="text-transparent bg-clip-text bg-gradient-to-r from-dental-600 to-dental-400">ідеальна усмішка</span> починається тут
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Поєднання передових технологій, професіоналізму лікарів для безболісного та ефективного лікування.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#appointment"
                className="px-8 py-4 bg-dental-600 hover:bg-dental-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-dental-200 transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Записатись зараз
                <ArrowRight size={20} />
              </a>
              <a
                href="#services"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 transition-all flex items-center justify-center"
              >
                Наші послуги
              </a>
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={18} />
                <span>Сучасне обладнання</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={18} />
                <span>Гарантія якості</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="lg:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-dental-100 to-transparent rounded-[3rem] transform rotate-3 scale-95 opacity-50 blur-2xl"></div>
            <img
              src="/Clinic-Image.png"
              alt="Інтер'єр клініки DentAI"
              className="relative rounded-[2rem] shadow-2xl object-cover w-full h-[500px] z-10"
            />
            {/* Floating Card */}
            <div className="absolute bottom-8 -left-4 md:-left-8 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                4.9
              </div>
              <div>
                <p className="font-bold text-gray-900">Відмінні відгуки</p>
                <p className="text-xs text-gray-500">Пацієнти задоволені</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;