import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, BarChart3, Upload, Settings, ShieldCheck, UserCheck, ArrowRight, Activity, Clock } from 'lucide-react';

const ImpactAnalyticsChart = () => {
  const [resumes, setResumes] = useState(300);

  // Calculations based on standard HR metrics (per 300 resumes baseline)
  const manualScreeningTime = Math.round((70 / 300) * resumes);
  const manualEmailTime = Math.round((8 / 300) * resumes);
  const manualScheduleTime = Math.round((5 / 300) * resumes);
  const manualTrackingTime = Math.round((9 / 300) * resumes);
  const manualTotalTime = Math.round((92 / 300) * resumes);
  const manualTotalCost = Math.round((23000 / 300) * resumes).toLocaleString('en-IN');

  const aiCost = Math.round((46 / 300) * resumes);
  
  // Dynamic AI speed logic (30s per 300 -> ~10 resumes per second)
  let aiTimeString = "30 seconds";
  if (resumes < 100) aiTimeString = "under 10s";
  else if (resumes > 600) aiTimeString = "under 2 mins";
  else if (resumes > 300) aiTimeString = "under 1 min";

  return (
    <div className="w-full mt-24 text-left relative z-10">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-xl">
          <h3 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">The PreciseHire Impact</h3>
          <p className="text-text-secondary text-base font-medium">Drag the slider to see exactly how much time and capital your HR team will save by switching to AI-powered screening.</p>
        </div>
        
        {/* Interactive Premium Slider */}
        <div className="bg-white border border-gray-100 p-5 rounded-2xl md:w-80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-indigo-400"></div>
          <div className="flex justify-between items-center mb-4">
            <label htmlFor="resume-slider" className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Pipeline Volume</label>
            <span className="text-sm font-black text-primary bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{resumes} Resumes</span>
          </div>
          <input 
            id="resume-slider"
            type="range" 
            min="50" 
            max="1000" 
            step="50" 
            value={resumes} 
            onChange={(e) => setResumes(Number(e.target.value))}
            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-indigo-500 transition-all"
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-8 relative">
        {/* Left Card - Manual */}
        <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-8 flex flex-col relative z-10 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-100 hover:-translate-y-1 overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-xl font-extrabold text-gray-900">Manual Screening</h4>
          </div>
          
          <ul className="space-y-5 mb-8 flex-1 text-sm font-medium text-gray-500 relative z-10">
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Screening {resumes} Resumes:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-red-600 transition-colors">{manualScreeningTime} hours</span>
            </li>
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Email & Follow-ups:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-red-600 transition-colors">{manualEmailTime} hours</span>
            </li>
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Interview Scheduling:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-red-600 transition-colors">{manualScheduleTime} hours</span>
            </li>
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Round Tracking:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-red-600 transition-colors">{manualTrackingTime} hours</span>
            </li>
          </ul>
          
          <div className="pt-6 relative z-10 mt-auto">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 group-hover:bg-red-500 group-hover:border-red-500 transition-colors duration-500">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 group-hover:text-red-100 transition-colors">Total Cost Per Cycle</span>
              <span className="text-lg font-black text-red-600 group-hover:text-white transition-colors">{manualTotalTime} hrs · Rs {manualTotalCost}</span>
            </div>
          </div>
        </div>

        {/* VS Label */}
        <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-20 flex justify-center py-6 md:py-0">
          <div className="bg-white text-gray-300 font-black italic text-xl w-16 h-16 flex items-center justify-center rounded-full border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:scale-125 backdrop-blur-xl">VS</div>
        </div>

        {/* Right Card - AI */}
        <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-8 flex flex-col relative z-10 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-1 overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-xl font-extrabold text-gray-900">PreciseHire AI</h4>
          </div>
          
          <ul className="space-y-5 mb-8 flex-1 text-sm font-medium text-gray-500 relative z-10">
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Screening {resumes} Resumes:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-primary transition-colors">{aiTimeString}</span>
            </li>
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Email & Follow-ups:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-primary transition-colors">Automated instantly</span>
            </li>
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Interview Scheduling:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-primary transition-colors">1-click magic link</span>
            </li>
            <li className="flex items-center justify-between group/item">
              <span className="group-hover/item:text-gray-900 transition-colors">Round Tracking:</span>
              <span className="font-bold text-gray-900 group-hover/item:text-primary transition-colors">Live dashboard</span>
            </li>
          </ul>
          
          <div className="pt-6 relative z-10 mt-auto">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 group-hover:bg-primary group-hover:border-primary transition-colors duration-500">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 group-hover:text-indigo-200 transition-colors">Total Cost Per Cycle</span>
              <span className="text-lg font-black text-primary group-hover:text-white transition-colors">{aiCost < 150 ? '< 1 min' : '< 2 mins'} · Rs {aiCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Highlight Banner */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 py-5 px-6 rounded-2xl text-center border border-indigo-100/50 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <p className="text-indigo-700 font-extrabold text-base md:text-lg relative z-10 tracking-wide">
          PreciseHire is <span className="text-primary">500x faster</span> and <span className="text-primary">500x cheaper</span> than manual recruitment.
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
