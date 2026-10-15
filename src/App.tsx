import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Simulator } from './components/Simulator';
import { HomomorphismLab } from './components/HomomorphismLab';
import { ComparisonTable } from './components/ComparisonTable';
import { SpecSection } from './components/SpecSection';
import { SecurityNotes } from './components/SecurityNotes';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black bg-dot-grid text-white selection:bg-white selection:text-black">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero */}
      <Hero />

      {/* 3. How It Works */}
      <HowItWorks />

      {/* 4. Simulator */}
      <Simulator />

      {/* 5. Homomorphism Lab */}
      <HomomorphismLab />

      {/* 6. Comparison Table */}
      <ComparisonTable />

      {/* 7. Protocol Spec */}
      <SpecSection />

      {/* 8. Security Notes */}
      <SecurityNotes />

      {/* 9. Footer */}
      <Footer />
    </div>
  );
};

export default App;
