import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import AppointmentForm from '../components/AppointmentForm';
import Footer from '../components/Footer';
import AIConsultant from '../components/AIConsultant';
import Doctors from '../components/Doctors';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow">
        <Hero />
        <Services />
        <Doctors />
        <AppointmentForm />
      </main>

      <Footer />
      <AIConsultant />
    </div>
  );
};

export default HomePage;





