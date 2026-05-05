import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, BarChart3, Upload, Settings, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

const Home = () => {
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
