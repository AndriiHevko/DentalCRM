import React from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-dental-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <span className="text-2xl font-bold">Dental Clinic</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Сучасна стоматологія з використанням передових технологій для вашого комфорту та здоров'я.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-dental-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-dental-600 transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">Контакти</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 flex-shrink-0 text-dental-500" size={18} />
                <span>вул. Хрещатик 1, Київ,<br />Україна, 01001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="flex-shrink-0 text-dental-500" size={18} />
                <a href="tel:+380440000000" className="hover:text-white transition-colors">+38 (044) 000-00-00</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="flex-shrink-0 text-dental-500" size={18} />
                <a href="mailto:info@dental_clinic.ua" className="hover:text-white transition-colors">info@dental_clinic.ua</a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-lg font-bold mb-6">Графік роботи</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center gap-3">
                <Clock className="text-dental-500" size={18} />
                <span>Пн-Пт: 09:00 - 18:00</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="text-dental-500 opacity-50" size={18} />
                <span>Сб: 10:00 - 18:00</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="text-dental-500 opacity-20" size={18} />
                <span>Нд: Вихідний</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Швидкі посилання</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#about" className="hover:text-dental-400 transition-colors">Про нас</a></li>
              <li><a href="#services" className="hover:text-dental-400 transition-colors">Послуги</a></li>
              <li><a href="#doctors" className="hover:text-dental-400 transition-colors">Лікарі</a></li>
              <li><a href="#appointment" className="hover:text-dental-400 transition-colors">Запис на прийом</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Dental Clinic. Всі права захищено.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;