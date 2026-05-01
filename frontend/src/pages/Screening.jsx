import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { screenCandidates } from '../services/api';
import { Target, Sliders, Play, Loader2, X, CheckCircle } from 'lucide-react';

const ROLES = [
  'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Product Manager',
  'Android Developer', 'iOS Developer', 'Other'
];

const Screening = () => {
  const navigate = useNavigate();
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  
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
    
    // Distribute remaining points proportionally to other sliders
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
    try {
      const payload = { jobId, jobDetails: { ...form, skills: finalSkills }, weightage };
      const { data } = await screenCandidates(payload);
      if (data.success) {
        localStorage.setItem('precisehire_weightage', JSON.stringify(weightage));
        localStorage.setItem('precisehire_jobDetails', JSON.stringify({ ...form, skills: finalSkills }));
        navigate('/shortlist');
      }
    } catch (e) {
      console.error('Screening failed:', e.message);
      alert(`Screening failed: ${e.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = weightage.skills + weightage.experience + weightage.quality;
  const isFormValid = form.title && form.description.split('\n').length >= 5 && totalWeight === 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-12 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold font-mono">✓</div>
          <span className="text-xs font-bold mt-2 text-green-500">Upload</span>
        </div>
        <div className="h-0.5 w-24 bg-blue-600"></div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
          <span className="text-xs font-bold mt-2 text-blue-600">Screening</span>
        </div>
        <div className="h-0.5 w-24 bg-gray-200"></div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold">3</div>
          <span className="text-xs font-medium mt-2 text-gray-400">Shortlist</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Job Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
          <div className="flex items-center mb-6 text-gray-900">
            <Target className="mr-2 text-blue-600" />
            <h3 className="text-xl font-bold">Job Requirements</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Job Description <span className="font-normal text-gray-400 font-mono">(min 5 lines)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-40"
                placeholder="Paste the complete job description here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role Bucket</label>
                <select
                  value={form.roleBucket}
                  onChange={(e) => setForm({ ...form, roleBucket: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Min Experience <span className="font-normal text-gray-400">(years)</span></label>
                <input
                  type="number"
                  value={form.minExperience}
                  onChange={(e) => setForm({ ...form, minExperience: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Required Skills <span className="font-normal text-gray-400">(press ENTER to add)</span></label>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.skills.map(skill => (
                  <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center border border-blue-100">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-500"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addSkill}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Typescript, AWS, React, etc."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Weightage */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            <div className="flex items-center mb-6 text-gray-900">
              <Sliders className="mr-2 text-blue-600" />
              <h3 className="text-xl font-bold">Scoring Weightage</h3>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Skills Match</label>
                  <span className="text-sm font-bold text-blue-600">{weightage.skills}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weightage.skills}
                  onChange={(e) => handleWeightageChange('skills', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Experience</label>
                  <span className="text-sm font-bold text-blue-600">{weightage.experience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weightage.experience}
                  onChange={(e) => handleWeightageChange('experience', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">Resume Quality</label>
                  <span className="text-sm font-bold text-blue-600">{weightage.quality}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weightage.quality}
                  onChange={(e) => handleWeightageChange('quality', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-center">
                {totalWeight === 100 ? (
                  <div className="flex items-center text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full border border-green-200">
                    <CheckCircle className="mr-2" size={18} /> Ready (100%)
                  </div>
                ) : (
                  <div className="text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full border border-red-200 flex items-center">
                    ⚠ Must total 100% (Current: {totalWeight}%)
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartScreening}
            disabled={!isFormValid || loading}
            className={`w-full py-6 rounded-2xl font-bold text-xl shadow-2xl flex items-center justify-center transition-all ${!isFormValid || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-3" size={24} />
                AI is Analyzing...
              </>
            ) : (
              <>
                <Play className="mr-3 fill-current" size={24} />
                Start AI Screening
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl scale-up">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="animate-spin" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Candidates</h3>
            <p className="text-gray-600 mb-2 font-mono">Llama 3.1 70B is working...</p>
            <p className="text-sm text-gray-400">This may take 1-2 minutes depending on the candidate count.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screening;
