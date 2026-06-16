import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, BarChart3, Upload, Settings, ShieldCheck, UserCheck, ArrowRight, Activity, Clock } from 'lucide-react';
import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';
import { WavePath } from '@/components/ui/wave-path';
import TrueFocus from '@/components/ui/TrueFocus';
import LogoLoop from '@/components/ui/LogoLoop';
import { AnimatedText } from '@/components/ui/animated-shiny-text';


const ImpactAnalyticsChart = () => {
  return (
    <div className="w-full mt-10 text-left font-sans">
      {/* Clean white card with subtle border and soft shadow */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm">
        
        {/* TOP PART — Two column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8 border-b border-slate-100 items-start md:items-center">
          {/* Left Column */}
          <div className="md:col-span-8">
            <h3 className="text-2xl sm:text-3xl font-black text-[#151e2e] tracking-tight">
              The PreciseHire Impact
            </h3>
            <p className="text-slate-500 text-sm sm:text-base font-medium mt-2 leading-relaxed">
              From Excel upload to ranked shortlist — here is what changes for your HR team
            </p>
          </div>
          
          {/* Right Column */}
          <div className="md:col-span-4 md:text-right">
            <div className="text-3xl sm:text-4xl font-black text-[#2563eb] tracking-tight">
              92 hrs → 12 min
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">
              per hiring cycle of 300 candidates
            </div>
          </div>
        </div>

        {/* MIDDLE PART — A horizontal timeline or process strip */}
        <div className="py-10">
          <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-2">
            {[
              {
                num: "01",
                title: "Resume Screening",
                manual: "70 hours",
                ai: "30 seconds",
              },
              {
                num: "02",
                title: "Email Writing",
                manual: "8 hours",
                ai: "Automatic",
              },
              {
                num: "03",
                title: "Interview Scheduling",
                manual: "5 hours",
                ai: "1 click",
              },
              {
                num: "04",
                title: "Round Tracking",
                manual: "9 hours",
                ai: "Real-time",
              },
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                {/* Step Box */}
                <div className="flex-1 w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-slate-200 transition-all duration-300">
                  <div>
                    {/* Number Badge and Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 select-none">
                        {step.num}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-[#151e2e] tracking-tight">
                        {step.title}
                      </h4>
                    </div>
                    
                    {/* Metrics Row 1: Manual */}
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs sm:text-sm">
                      <span className="font-medium text-slate-400">Manual</span>
                      <span className="font-bold text-[#DC2626] bg-[#DC2626]/5 px-2.5 py-0.5 rounded-full">{step.manual}</span>
                    </div>
                    
                    {/* Metrics Row 2: PreciseHire */}
                    <div className="flex justify-between items-center pt-2.5 text-xs sm:text-sm">
                      <span className="font-medium text-slate-400">PreciseHire</span>
                      <span className="font-bold text-[#16A34A] bg-[#16A34A]/5 px-2.5 py-0.5 rounded-full">{step.ai}</span>
                    </div>
                  </div>
                </div>

                {/* Right Arrow (only between steps, hidden on small screens, shown side by side on lg screen) */}
                {idx < 3 && (
                  <div className="hidden lg:flex items-center justify-center px-2">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                {/* Vertical arrow for mobile stacking */}
                {idx < 3 && (
                  <div className="lg:hidden flex items-center justify-center py-1">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* BOTTOM PART — Three metric boxes side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
          {[
            { value: "500x", label: "Faster than manual" },
            { value: "₹46", label: "Cost per hiring cycle" },
            { value: "0", label: "Manual emails needed" },
          ].map((box, idx) => (
            <div key={idx} className="bg-[#f0f7ff] rounded-2xl p-6 text-center border border-[#2563eb]/5">
              <div className="text-3xl sm:text-4xl font-black text-[#2563eb] tracking-tight">
                {box.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#151e2e] mt-1.5 opacity-80">
                {box.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const words = [
    { text: "Hire" },
    { text: "the" },
    { text: "Right" },
    { text: "People" },
    { text: "10x" },
    { text: "Faster", className: "text-primary" }
  ];

  return (
    <div className="bg-white relative font-sans animate-fade-in-up">
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative isolate pt-6 bg-white hero-grid border-b border-border">
          <div className="mx-auto max-w-7xl px-8 pt-10 pb-20 sm:pt-16 sm:pb-40 text-center">
            <AnimatedText
              text="PreciseHire"
              gradientColors="linear-gradient(90deg, #151e2e 25%, #2563eb 50%, #151e2e 75%)"
              gradientAnimationDuration={3}
              hoverEffect={true}
              textClassName="text-[48px] sm:text-7xl md:text-8xl lg:text-[85px] font-black tracking-tighter select-none leading-none"
              className="py-0 mb-6"
            />

            <h1 className="flex justify-center w-full">
              <TypewriterEffectSmooth
                words={words}
                delay={0.5}
                duration={2.8}
                className="text-[18px] sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-10 leading-[1.1] justify-center text-text-primary"
              />
            </h1>


            <p className="mt-10 text-xl leading-8 text-text-secondary max-w-3xl mx-auto font-medium">
              PreciseHire automates your entire hiring pipeline — from Excel upload to offer letter. Upload candidate sheets, set your JD and scoring weightage, and let AI rank the best matches in under 30 seconds.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/app"
                className="rounded-lg bg-primary px-8 py-4 text-lg font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95 cursor-pointer inline-flex items-center justify-center"
              >
                Start Screening
              </Link>
              <a 
                href="#how-it-works" 
                className="rounded-lg px-8 py-4 text-lg font-bold text-primary border border-primary hover:bg-primary/5 transition-all flex items-center gap-2 cursor-pointer"
              >
                See How It Works
              </a>
            </div>

            <div className="flex justify-center my-14">
              <WavePath className="text-slate-200/80" />
            </div>
            
            <div className="max-w-5xl mx-auto w-full">
              <ImpactAnalyticsChart />
            </div>
          </div>
        </div>

        {/* Trusted By Section */}
        <div className="py-12 bg-surface border-b border-border">
          <div className="mx-auto max-w-7xl px-8 lg:px-8">
            <p className="text-center text-[10px] font-black leading-8 text-text-secondary uppercase tracking-[0.25em] mb-8">
              BUILT ON ENTERPRISE-GRADE INFRASTRUCTURE
            </p>
            <div className="opacity-45 select-none pointer-events-none">
              <LogoLoop
                logos={[
                  { node: <span className="font-black text-2xl tracking-tighter italic text-[#151e2e]">NVIDIA</span>, title: "NVIDIA" },
                  { node: <span className="font-black text-2xl tracking-tighter text-[#151e2e]">META</span>, title: "META" },
                  { node: <span className="font-black text-2xl tracking-tighter italic text-[#151e2e]">AWS</span>, title: "AWS" },
                  { node: <span className="font-black text-2xl tracking-tighter text-[#151e2e]">STRIPE</span>, title: "STRIPE" },
                  { node: <span className="font-black text-2xl tracking-tighter italic text-[#151e2e]">AIRBNB</span>, title: "AIRBNB" },
                ]}
                speed={50}
                direction="left"
                logoHeight={32}
                gap={70}
                fadeOut={true}
                fadeOutColor="#f8fafc"
                ariaLabel="Enterprise infrastructure partners"
              />
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="py-20 sm:py-40 bg-white">
          <div className="mx-auto max-w-7xl px-8 lg:px-8">
            <div className="text-center mb-20">
              <div className="mb-4">
                <TrueFocus 
                  sentence="How PreciseHire Works"
                  manualMode={false}
                  blurAmount={4}
                  borderColor="#2563eb"
                  glowColor="rgba(37, 99, 235, 0.15)"
                  animationDuration={0.5}
                  pauseBetweenAnimations={1.0}
                />
              </div>
              <p className="text-lg text-text-secondary font-medium">Three simple steps to find your best candidates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
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
                <div key={idx} className="relative group p-8 bg-surface border border-border rounded-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-saas-lg">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
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
        <div className="py-20 sm:py-40 bg-surface border-t border-border">
          <div className="mx-auto max-w-7xl px-8 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
              <div className="text-center p-10">
                <dd className="text-6xl font-black text-text-primary mb-2">92hrs</dd>
                <dt className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-4 italic">Time saved per role</dt>
                <p className="text-text-secondary text-sm font-medium">Reduced from 2+ weeks to under 12 minutes.</p>
              </div>
              <div className="text-center p-10 border-y lg:border-y-0 lg:border-x border-border">
                <dd className="text-6xl font-black text-text-primary mb-2">₹46</dd>
                <dt className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-4 italic">Cost per hiring cycle</dt>
                <p className="text-text-secondary text-sm font-medium">Compared to ₹23,000 for manual screening.</p>
              </div>
              <div className="text-center p-10">
                <dd className="text-6xl font-black text-text-primary mb-2">30s</dd>
                <dt className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-4 italic">To score 300 resumes</dt>
                <p className="text-text-secondary text-sm font-medium">Powered by Llama 3.1 70B on NVIDIA NIM.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-10 text-center border-t border-border bg-white">
          <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest">
            PreciseHire © 2025 · AI-Powered Recruitment
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
