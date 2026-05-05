import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminApp from './pages/AdminApp';
import Screening from './pages/Screening';
import Shortlist from './pages/Shortlist';
import Pipeline from './pages/Pipeline';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { BackgroundBeams } from './components/ui/background-beams';

function App() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#7c3aed]/30">
        {/* Professional Glow Effect for Dashboard Pages */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#7c3aed]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/app" element={<AdminApp showToast={showToast} />} />
              <Route path="/screening" element={<Screening showToast={showToast} />} />
              <Route path="/shortlist" element={<Shortlist showToast={showToast} />} />
              <Route path="/pipeline" element={<Pipeline showToast={showToast} />} />
            </Routes>
          </main>

          {toast && (
            <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 p-4 rounded-2xl shadow-2xl border slide-up ${toast.type === 'success' ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-bold text-sm pr-4">{toast.message}</p>
              <button onClick={() => setToast(null)} className="hover:opacity-70 transition-opacity">
                <X size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
