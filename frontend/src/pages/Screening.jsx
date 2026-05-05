import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { screenCandidates } from '../services/api';
import { Loader2, X, CheckCircle, Sparkles, AlertCircle, Briefcase, Settings2 } from 'lucide-react';

const ROLES = [
  'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Product Manager',
  'Android Developer', 'iOS Developer', 'Other'
];

const STATUS_MESSAGES = [
  "Reading resumes...",
  "Extracting candidate skills...",
  "AI analyzing job fit...",
  "Ranking potential matches...",
  "Almost there, finalizing scores..."
];

const Screening = () => {
  const navigate = useNavigate();
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [screeningComplete, setScreeningComplete] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [statusIdx, setStatusIdx] = useState(0);
  const [showSafetyHatch, setShowSafetyHatch] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    roleBucket: 'Frontend Developer',
    skills: [],
    minExperience: 2
  });

  const [weightage, setWeightage] = useState({
    skills: 40,
    experience: 30,
    quality: 30
  });

  useEffect(() => {
    const storedJobId = localStorage.getItem('precisehire_jobId');
    if (!storedJobId) navigate('/app');
    else setJobId(storedJobId);
  }, [navigate]);

  const handleWeightageChange = (key, value) => {
    const val = parseInt(value);
    const otherKeys = Object.keys(weightage).filter(k => k !== key);
    const remaining = 100 - val;
    
    const currentOthersTotal = weightage[otherKeys[0]] + weightage[otherKeys[1]];
    let newOther1, newOther2;
    
    if (currentOthersTotal === 0) {
      newOther1 = Math.floor(remaining / 2);
      newOther2 = remaining - newOther1;
    } else {
      newOther1 = Math.round((weightage[otherKeys[0]] / currentOthersTotal) * remaining);
      newOther2 = remaining - newOther1;
    }

    setWeightage({
      [key]: val,
      [otherKeys[0]]: newOther1,
      [otherKeys[1]]: newOther2
    });
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      if (!form.skills.includes(skillInput.trim())) {
        setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter(s => s !== skill) });
  };

  const handleStartScreening = async () => {
    let finalSkills = [...form.skills];
    if (skillInput.trim() && !finalSkills.includes(skillInput.trim())) {
      finalSkills.push(skillInput.trim());
    }

    if (finalSkills.length === 0) {
      if (!window.confirm("You haven't added any specific skills to match. The AI will score based on the Job Title and Description only. Continue?")) {
        return;
      }
    }

    setLoading(true);
    setShowSafetyHatch(false);
    
    const statusInterval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 15000);

    const hatchTimer = setTimeout(() => {
      setShowSafetyHatch(true);
    }, 45000);

    try {
      const payload = { jobId, jobDetails: { ...form, skills: finalSkills }, weightage };
      const { data } = await screenCandidates(payload);
      
      if (data.success) {
        localStorage.setItem('precisehire_weightage', JSON.stringify(weightage));
        localStorage.setItem('precisehire_jobDetails', JSON.stringify({ ...form, skills: finalSkills }));
        setScreeningComplete(true);
        setTimeout(() => navigate('/shortlist'), 800);
      } else {
        throw new Error(data.error || 'Screening failed on backend');
      }
    } catch (e) {
      console.error('Screening Error:', e);
      alert(`Screening failed: ${e.message}`);
    } finally {
      clearInterval(statusInterval);
      clearTimeout(hatchTimer);
      setLoading(false);
    }
  };

  const totalWeight = weightage.skills + weightage.experience + weightage.quality;
  const isFormValid = form.title && form.description.split('\n').length >= 5 && totalWeight === 100;

  const inputStyle = "w-full bg-white border border-border rounded-lg px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-text-primary placeholder-gray-400 font-medium text-sm";
  const labelStyle = "block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest";

  return (
    <div className="bg-surface min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-20 max-w-xs mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border -translate-y-1/2"></div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold border border-success/20 bg-white shadow-saas">✓</div>
            <span className="text-[10px] font-bold mt-2 text-text-secondary uppercase tracking-wider">Upload</span>
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-saas ring-4 ring-primary/10">2</div>
            <span className="text-[10px] font-bold mt-2 text-text-primary uppercase tracking-wider">Screening</span>
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-white text-text-secondary flex items-center justify-center text-xs font-bold border border-border shadow-saas">3</div>
            <span className="text-[10px] font-bold mt-2 text-text-secondary uppercase tracking-wider">Shortlist</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Job Details */}
          <div className="bg-white border border-border rounded-2xl shadow-saas p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                <Briefcase size={20} />
              </div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Job details</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className={labelStyle}>Job title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputStyle}
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className={labelStyle}>
                  Job description <span className="text-gray-400 font-bold lowercase italic ml-1">(min 5 lines)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputStyle} h-40 resize-none leading-relaxed`}
                  placeholder="Paste the complete job description here..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelStyle}>Role bucket</label>
                  <select
                    value={form.roleBucket}
                    onChange={(e) => setForm({ ...form, roleBucket: e.target.value })}
                    className={`${inputStyle} cursor-pointer`}
                  >
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Min experience (years)</label>
                  <input
                    type="number"
                    value={form.minExperience}
                    onChange={(e) => setForm({ ...form, minExperience: parseInt(e.target.value) })}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>
                  Required skills <span className="text-gray-400 font-bold lowercase italic ml-1">(press enter to add)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-4 mt-1">
                  {form.skills.map(skill => (
                    <span key={skill} className="bg-surface text-text-primary px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center border border-border group hover:border-primary transition-all">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-2 text-text-secondary hover:text-red-500 transition-colors"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  className={inputStyle}
                  placeholder="Typescript, AWS, React, etc."
                />
              </div>
            </div>
          </div>

          {/* Right Column: Weightage */}
          <div className="bg-white border border-border rounded-2xl shadow-saas p-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-primary/5 rounded-lg text-primary">
                <Settings2 size={20} />
              </div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Scoring weightage</h3>
            </div>

            <div className="space-y-12">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Skills match</label>
                  <span className="text-xl font-bold text-primary">{weightage.skills}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weightage.skills}
                  onChange={(e) => handleWeightageChange('skills', e.target.value)}
                  className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-primary border border-border"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Experience</label>
                  <span className="text-xl font-bold text-primary">{weightage.experience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weightage.experience}
                  onChange={(e) => handleWeightageChange('experience', e.target.value)}
                  className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-primary border border-border"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Resume quality</label>
                  <span className="text-xl font-bold text-primary">{weightage.quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weightage.quality}
                  onChange={(e) => handleWeightageChange('quality', e.target.value)}
                  className="w-full h-1.5 bg-surface rounded-lg appearance-none cursor-pointer accent-primary border border-border"
                />
              </div>

              <div className="pt-6 border-t border-border flex items-center">
                {totalWeight === 100 ? (
                  <div className="flex items-center text-success text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle className="mr-2" size={14} /> Total weight: 100%
                  </div>
                ) : (
                  <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center">
                    <AlertCircle className="mr-2" size={14} /> Total must be 100% (Current: {totalWeight}%)
                  </div>
                )}
              </div>

              <button
                onClick={handleStartScreening}
                disabled={!isFormValid || loading}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] ${!isFormValid || loading ? 'bg-surface text-text-secondary cursor-not-allowed border border-border' : 'bg-primary text-white hover:bg-primary/90 shadow-saas'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Analyzing resumes...
                  </div>
                ) : 'Start AI Screening'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 border-4 border-surface border-t-primary rounded-full animate-spin mx-auto mb-8 shadow-saas"></div>
            <h3 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">{STATUS_MESSAGES[statusIdx]}</h3>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="text-primary" size={16} />
              <p className="text-primary font-bold text-[10px] uppercase tracking-widest">Llama 3.1 Powered Engine</p>
            </div>
            <p className="text-text-secondary text-sm font-medium leading-relaxed">
              Our AI models are carefully evaluating every resume against your job description. This usually takes 1-2 minutes.
            </p>
            
            {(screeningComplete || showSafetyHatch) && (
              <div className="mt-12 animate-in slide-in-from-bottom duration-500">
                <button 
                  onClick={() => navigate('/shortlist')}
                  className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-saas flex items-center gap-2 mx-auto"
                >
                  {screeningComplete ? 'View ranked results' : 'Skip and view progress'} <ArrowRight size={18} />
                </button>
                {!screeningComplete && (
                  <p className="text-[10px] font-bold text-text-secondary mt-4 uppercase tracking-widest italic opacity-60">Analysis is taking longer than usual.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Screening;
