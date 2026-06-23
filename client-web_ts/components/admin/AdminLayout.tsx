import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../../types';
import { fetchUserProfile, logoutUser } from '../../services/api';
import { LayoutDashboard, Users, Calendar, Stethoscope, TrendingUp, LogOut, Activity, FileText } from 'lucide-react';

const TOKEN_KEY = 'dental_clinic_tokens';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setToken(parsed.access);
      } catch (e) {
        console.error('Token parse error', e);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profile = await fetchUserProfile(token);
        if (!profile.is_staff) {
          console.warn('User is not staff. Redirecting...');
          navigate('/');
        } else {
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Failed to fetch profile in admin', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token, navigate]);

  const handleLogout = () => {
    sessionStorage.setItem('isLoggingOut', 'true');
    
    const saved = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        
        fetch(`${API_URL}/logout/`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parsed.access}`
          },
          body: JSON.stringify({ refresh: parsed.refresh }),
        }).catch(() => {});
      } catch (e) {}
    }

    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dental-100 border-t-dental-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm shrink-0 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="text-xl font-bold">D</span>
            </div>
            <span className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">Dental Admin</span>
            <span className="ml-3 pl-3 border-l-2 border-gray-200 text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-widest hidden sm:block">
              Управління
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900">{userProfile?.first_name} {userProfile?.last_name}</p>
              <p className="text-xs text-gray-500">Адміністратор</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
              title="Вийти"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-28 self-start">
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
            <div className="px-4 pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Меню Адміна</h3>
            </div>
            <nav className="flex flex-col gap-2">
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin') && location.pathname === '/admin'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <LayoutDashboard size={20} />
                Головна
              </Link>
              <Link
                to="/admin/statistics"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin/statistics')
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <TrendingUp size={20} />
                Аналітика
              </Link>
              <Link
                to="/admin/patients"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin/patients')
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Users size={20} />
                Пацієнти
              </Link>
              <Link
                to="/admin/appointments"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin/appointments')
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Calendar size={20} />
                Записи на прийом
              </Link>
              <Link
                to="/admin/doctors"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin/doctors')
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Stethoscope size={20} />
                Лікарі та графік
              </Link>
              <Link
                to="/admin/services"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin/services')
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Activity size={20} />
                Послуги та прайс
              </Link>
              <Link
                to="/admin/invoices"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive('/admin/invoices')
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <FileText size={20} />
                Фінанси та Чеки
              </Link>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet context={{ token, userProfile }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;