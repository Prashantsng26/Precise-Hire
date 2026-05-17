import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, BarChart3, Upload, Settings, ShieldCheck, UserCheck, ArrowRight, Activity, Clock } from 'lucide-react';

const ImpactAnalyticsChart = () => {
  return (
    <div className="w-full mt-16 text-left">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-text-primary tracking-tight">The PreciseHire Impact</h3>
        <p className="text-text-secondary text-sm font-medium mt-1">See how much time and money your HR team saves with AI-powered screening</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 relative">
        {/* Left Card */}
        <div className="flex-1 bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col relative z-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-red-600" />
            <h4 className="text-lg font-bold text-red-600">Manual Screening</h4>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm font-medium text-red-900/80">
            <li className="flex items-center justify-between">
              <span>300 Resumes:</span>
              <span className="font-bold">70 hours</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Email writing:</span>
              <span className="font-bold">8 hours</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Scheduling:</span>
              <span className="font-bold">5 hours</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Round tracking:</span>
              <span className="font-bold">9 hours</span>
            </li>
          </ul>
          <div className="border-t border-red-200 pt-6">
            <p className="text-sm font-bold text-red-600 text-center">Total: 92 hours · Rs 23,000 per cycle</p>
          </div>
        </div>

        {/* VS Label */}
        <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-20 flex justify-center py-4 md:py-0">
          <span className="bg-white text-gray-400 font-black italic text-2xl w-14 h-14 flex items-center justify-center rounded-full border border-gray-100 shadow-sm">VS</span>
        </div>

        {/* Right Card */}
        <div className="flex-1 bg-green-50 border border-green-200 rounded-2xl p-8 flex flex-col relative z-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-bold text-green-600">PreciseHire AI</h4>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm font-medium text-green-900/80">
            <li className="flex items-center justify-between">
              <span>300 Resumes:</span>
              <span className="font-bold">30 seconds</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Email writing:</span>
              <span className="font-bold">automatic</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Scheduling:</span>
              <span className="font-bold">1 click</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Round tracking:</span>
              <span className="font-bold">real-time</span>
            </li>
          </ul>
          <div className="border-t border-green-200 pt-6">
            <p className="text-sm font-bold text-green-600 text-center">Total: 12 minutes · Rs 46 per cycle</p>
          </div>
        </div>
      </div>

      {/* Bottom Highlight Banner */}
      <div className="mt-8 bg-blue-50 py-4 px-6 rounded-xl text-center border border-blue-100">
        <p className="text-blue-600 font-bold text-base md:text-lg">
          PreciseHire is 500x faster and 500x cheaper than manual recruitment
        </p>
      </div>
    </div>
  );
};const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white relative font-sans">
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative isolate pt-14 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-text-primary sm:text-7xl mb-8 leading-[1.1]">
              Hire the Right People.<br />
              <span className="text-primary">10x Faster.</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-text-secondary max-w-3xl mx-auto font-medium">
              PreciseHire automates your entire hiring pipeline — from Excel upload to offer letter. Upload candidate sheets, set your JD and scoring weightage, and let AI rank the best matches in under 30 seconds.
            </p>
            <div className="mt-12 flex items-center justify-center gap-x-6">
              <button
                onClick={() => navigate('/app')}
                className="rounded-lg bg-primary px-8 py-4 text-lg font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95"
              >
                Start Screening
              </button>
              <a 
                href="#how-it-works" 
                className="rounded-lg px-8 py-4 text-lg font-bold text-primary border border-primary hover:bg-primary/5 transition-all flex items-center gap-2"
              >
                See How It Works
              </a>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <ImpactAnalyticsChart />
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="py-12 bg-surface border-y border-border">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <p className="text-center text-[10px] font-bold leading-8 text-gray-400 uppercase tracking-[0.25em] mb-8">
              BUILT ON ENTERPRISE-GRADE INFRASTRUCTURE
            </p>
            <div className="mx-auto grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5 opacity-40 grayscale">
              <div className="text-text-primary font-black text-2xl text-center tracking-tighter italic">NVIDIA</div>
              <div className="text-text-primary font-black text-2xl text-center tracking-tighter">META</div>
              <div className="text-text-primary font-black text-2xl text-center tracking-tighter italic">AWS</div>
              <div className="text-text-primary font-black text-2xl text-center tracking-tighter">STRIPE</div>
              <div className="text-text-primary font-black text-2xl text-center tracking-tighter italic">AIRBNB</div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-4">How PreciseHire Works</h2>
              <p className="text-lg text-text-secondary font-medium">Three simple steps to find your best candidates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {[
                {
                  step: "01",
                  icon: <Upload className="h-6 w-6 text-primary" />,
                  title: "Upload Candidates",
                  description: "Import your Excel sheet with candidate names, emails and resume links."
                },
                {
                  step: "02",
                  icon: <Settings className="h-6 w-6 text-primary" />,
                  title: "Set Your Criteria",
                  description: "Enter the job description, required skills, and choose how to weight skills and experience."
                },
                {
                  step: "03",
                  icon: <Zap className="h-6 w-6 text-primary" />,
                  title: "AI Scores Everyone",
                  description: "Llama AI reads each resume and scores all candidates in under 30 seconds."
                },
                {
                  step: "04",
                  icon: <UserCheck className="h-6 w-6 text-primary" />,
                  title: "Review and Hire",
                  description: "See your ranked shortlist, send interview invites, and track candidates."
                }
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-4xl font-black text-primary/10 group-hover:text-primary/20 transition-colors">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-3">{item.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed font-medium">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-24 sm:py-32 bg-surface border-t border-border">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="text-center p-8">
                <dd className="text-6xl font-black text-text-primary mb-2">92hrs</dd>
                <dt className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-4 italic">Time saved per role</dt>
                <p className="text-text-secondary text-sm font-medium">Reduced from 2+ weeks to under 12 minutes.</p>
              </div>
              <div className="text-center p-8 border-x border-border">
                <dd className="text-6xl font-black text-text-primary mb-2">₹46</dd>
                <dt className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-4 italic">Cost per hiring cycle</dt>
                <p className="text-text-secondary text-sm font-medium">Compared to ₹23,000 for manual screening.</p>
              </div>
              <div className="text-center p-8">
                <dd className="text-6xl font-black text-text-primary mb-2">30s</dd>
                <dt className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-4 italic">To score 300 resumes</dt>
                <p className="text-text-secondary text-sm font-medium">Powered by Llama 3.1 70B on NVIDIA NIM.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 text-center border-t border-border bg-white">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            PreciseHire © 2025 · AI-Powered Recruitment
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
