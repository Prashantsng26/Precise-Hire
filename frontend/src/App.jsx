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
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans relative overflow-x-hidden selection:bg-primary/10">
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
            <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 p-4 rounded-xl shadow-saas-lg border animate-in slide-in-from-bottom duration-300 ${toast.type === 'success' ? 'bg-white border-green-100 text-success' : 'bg-white border-red-100 text-red-600'}`}>
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <p className="font-bold text-xs pr-4 tracking-tight">{toast.message}</p>
              <button onClick={() => setToast(null)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
