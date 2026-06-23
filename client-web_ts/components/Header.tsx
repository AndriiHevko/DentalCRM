import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuthStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('dental_clinic_tokens'));
    };

    checkAuthStatus();

    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, [location.pathname]);

  const navLinks: { name: string; href: string; route?: boolean }[] = [
    { name: 'Головна', href: '/' },
    { name: 'Послуги', href: '#services' },
    { name: 'Лікарі', href: '#doctors' },
    { name: 'Контакти', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-6'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-dental-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-xl font-bold">D</span>
            </div>
            <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              Dental Clinic
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.route ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-dental-600 transition-colors"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-dental-600 transition-colors"
                >
                  {link.name}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="#appointment"
              className="hidden md:inline-flex px-5 py-2.5 bg-dental-600 hover:bg-dental-700 text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
            >
              Записатись
            </a>
            {/* Login/Register або Cabinet Button */}
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/cabinet')}
                className="hidden md:inline-flex px-5 py-2.5 bg-white border border-dental-600 text-dental-600 text-sm font-semibold rounded-full hover:bg-dental-50 transition-all shadow-md hover:shadow-lg"
              >
                Особистий кабінет
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:inline-flex px-5 py-2.5 bg-white border border-dental-600 text-dental-600 text-sm font-semibold rounded-full hover:bg-dental-50 transition-all shadow-md hover:shadow-lg"
              >
                Увійти/Зареєструватись
              </button>
            )}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {navLinks.map((link) =>
            link.route ? (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-gray-700 py-2 border-b border-gray-50 last:border-0 hover:text-dental-600"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-gray-700 py-2 border-b border-gray-50 last:border-0 hover:text-dental-600"
              >
                {link.name}
              </a>
            )
          )}
          <a
            href="#appointment"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full text-center px-5 py-3 bg-dental-600 text-white font-bold rounded-xl"
          >
            Записатись
          </a>
          {/* Login/Register Button for mobile */}
          {isLoggedIn ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/cabinet');
              }}
              className="w-full text-center px-5 py-3 bg-white border border-dental-600 text-dental-600 font-bold rounded-xl mt-1"
            >
              Особистий кабінет
            </button>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/login');
              }}
              className="w-full text-center px-5 py-3 bg-white border border-dental-600 text-dental-600 font-bold rounded-xl mt-1"
            >
              Увійти/Зареєструватись
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;