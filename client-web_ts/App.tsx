import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CabinetPage from './pages/CabinetPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Admin imports
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPatientsPage from './pages/admin/AdminPatientsPage';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminAppointmentsPage from './pages/admin/AdminAppointmentsPage';
import AdminStatisticsPage from './pages/admin/AdminStatisticsPage';
import { InvoicesAdminPage } from './pages/admin/InvoicesAdminPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cabinet" element={<CabinetPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="patients" element={<AdminPatientsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="statistics" element={<AdminStatisticsPage />} />
        <Route path="invoices" element={<InvoicesAdminPage />} />
      </Route>
    </Routes>
  );
};

export default App;