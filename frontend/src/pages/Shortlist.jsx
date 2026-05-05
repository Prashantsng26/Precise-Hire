import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getShortlist, sendInterviewInvites, sendAssessmentLinks, createPipeline } from '../services/api';
import { Mail, FileCheck, ArrowRight, Loader2, CheckSquare, Square, X, Calendar, Clock, Link, Sparkles, Zap, Eye, FileText, CheckCircle2 } from 'lucide-react';

const Shortlist = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [jobId, setJobId] = useState('');
  const [weightage, setWeightage] = useState({});
  const [jobDetails, setJobDetails] = useState({});
  const [modal, setModal] = useState({ type: '', open: false, loading: false });
  const [modalForm, setModalForm] = useState({ date: '', time: '', meetLink: '', assessmentUrl: '', deadline: '' });
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const jId = localStorage.getItem('precisehire_jobId');
    if (!jId) {
      navigate('/app');
      return;
    }
    
    setJobId(jId);
    setWeightage(JSON.parse(localStorage.getItem('precisehire_weightage') || '{}'));
    setJobDetails(JSON.parse(localStorage.getItem('precisehire_jobDetails') || '{}'));

    const fetchShortlist = async () => {
      try {
        const { data } = await getShortlist(jId);
        if (data && data.success) {
          setCandidates(data.candidates || []);
        }
      } catch (e) {
        console.error('Fetch shortlist failed');
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchShortlist();
  }, [navigate]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === candidates.length) setSelectedIds([]);
    else setSelectedIds(candidates.map(c => c.candidateId));
  };

  const handleAction = async (type) => {
    setModal({ type, open: true, loading: false });
  };

  const handleSend = async () => {
    setModal({ ...modal, loading: true });
    const selectedCandidates = candidates.filter(c => selectedIds.includes(c.candidateId));
    
    try {
      let res;
      if (modal.type === 'interview') {
        res = await sendInterviewInvites({
          candidates: selectedCandidates,
          details: { ...modalForm, jobTitle: jobDetails.title }
        });
      } else if (modal.type === 'assessment') {
        res = await sendAssessmentLinks({
          candidates: selectedCandidates,
          details: { ...modalForm, jobTitle: jobDetails.title }
        });
      }

      if (res?.data?.success) {
        setModal({ ...modal, open: false, loading: false });
        alert(`Success! Distributed to ${selectedCandidates.length} candidates.`);
      }
    } catch (e) {
      console.error('Action failed');
    } finally {
      setModal({ ...modal, loading: false });
    }
  };

  const moveToPipeline = async () => {
    if (selectedIds.length === 0) return;
    setMoving(true);
    try {
      const { data } = await createPipeline({ jobId, candidateIds: selectedIds });
      if (data.success) {
        navigate('/pipeline');
      } else {
        alert('Failed to move candidates to pipeline');
      }
    } catch (e) {
      console.error('Pipeline move failed');
      alert('Error moving to pipeline. Check if backend is running.');
    } finally {
      setMoving(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const openResume = (link) => {
    if (!link) return alert('Resume link not found');
    window.open(link, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] bg-surface">
      <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">Ranking candidates...</p>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen pb-40">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-20 max-w-xs mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border -translate-y-1/2"></div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold border border-success/20 bg-white shadow-saas">✓</div>
            <span className="text-[10px] font-bold mt-2 text-text-secondary uppercase tracking-wider">Upload</span>
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-bold border border-success/20 bg-white shadow-saas">✓</div>
            <span className="text-[10px] font-bold mt-2 text-text-secondary uppercase tracking-wider">Screening</span>
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-saas ring-4 ring-primary/10">3</div>
            <span className="text-[10px] font-bold mt-2 text-text-primary uppercase tracking-wider">Shortlist</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary mb-3">
              {jobDetails.title} <span className="text-text-secondary font-medium">shortlist</span>
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-text-secondary text-sm font-medium">{candidates.length} candidates ranked by AI</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-border bg-white text-text-secondary uppercase tracking-tight">Skills {weightage.skills}%</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-border bg-white text-text-secondary uppercase tracking-tight">Exp {weightage.experience}%</span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-border bg-white text-text-secondary uppercase tracking-tight">Quality {weightage.quality}%</span>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-saas overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-text-secondary text-[10px] font-bold border-b border-border bg-surface uppercase tracking-wider">
                  <th className="px-6 py-5">
                    <button onClick={toggleAll} className="transition-opacity hover:opacity-70 focus:outline-none">
                      {selectedIds.length === candidates.length && candidates.length > 0 ? 
                        <div className="w-4 h-4 bg-primary rounded flex items-center justify-center shadow-lg"><CheckSquare size={14} className="text-white" /></div> : 
                        <div className="w-4 h-4 border border-border bg-white rounded"></div>}
                    </button>
                  </th>
                  <th className="px-6 py-5">Rank</th>
                  <th className="px-6 py-5">Candidate</th>
                  <th className="px-6 py-5">Skills</th>
                  <th className="px-6 py-5">Experience</th>
                  <th className="px-6 py-5">Quality</th>
                  <th className="px-6 py-5 text-right">Total score</th>
                  <th className="px-6 py-5">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((c, idx) => (
                  <tr key={c.candidateId} className={`transition-all hover:bg-surface ${selectedIds.includes(c.candidateId) ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-6">
                      <button onClick={() => toggleSelect(c.candidateId)} className="transition-opacity hover:opacity-70 focus:outline-none">
                        {selectedIds.includes(c.candidateId) ? 
                          <div className="w-4 h-4 bg-primary rounded flex items-center justify-center shadow-lg"><CheckSquare size={14} className="text-white" /></div> : 
                          <div className="w-4 h-4 border border-border bg-white rounded"></div>}
                      </button>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-text-secondary font-bold text-sm">#{idx + 1}</span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-text-primary text-sm mb-0.5">{c.name}</p>
                      <p className="text-[11px] text-text-secondary font-medium">{c.email}</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${getScoreColor(c.skills_score)}`}></div>
                        <span className="text-sm font-bold text-text-primary">{c.skills_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${getScoreColor(c.experience_score)}`}></div>
                        <span className="text-sm font-bold text-text-primary">{c.experience_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${getScoreColor(c.quality_score)}`}></div>
                        <span className="text-sm font-bold text-text-primary">{c.quality_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-text-primary">{(c.weighted_score || 0).toFixed(0)}</span>
                        <span className="text-text-secondary text-[10px] font-bold">/100</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-success/10 text-success text-[8px] font-black uppercase tracking-widest mt-1">Qualified</span>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => openResume(c.resumeLink)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:bg-white hover:text-primary hover:border-primary/30 transition-all group shadow-sm"
                      >
                        <Eye size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Minimal Floating Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-border rounded-2xl shadow-saas-lg p-3 flex items-center gap-6 z-40 animate-in slide-in-from-bottom duration-300 ring-1 ring-black/5 max-w-2xl">
            <div className="pl-4 pr-6 border-r border-border">
              <p className="text-sm font-bold text-text-primary">
                {selectedIds.length} <span className="text-text-secondary font-medium ml-1">selected</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleAction('interview')} className="px-4 py-2 rounded-xl text-[10px] font-bold text-text-secondary hover:bg-surface hover:text-primary transition-all flex items-center gap-2 uppercase tracking-wider">
                <Calendar size={14} /> Interview
              </button>
              <button onClick={() => handleAction('assessment')} className="px-4 py-2 rounded-xl text-[10px] font-bold text-text-secondary hover:bg-surface hover:text-primary transition-all flex items-center gap-2 uppercase tracking-wider">
                <FileCheck size={14} /> Assessment
              </button>
            </div>
            <button 
              disabled={moving}
              onClick={moveToPipeline} 
              className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 text-xs hover:bg-primary/90 shadow-saas disabled:opacity-50"
            >
              {moving ? <Loader2 className="animate-spin" size={14} /> : 'Move to pipeline'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Action Modal */}
        {modal.open && (
          <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white border border-border rounded-2xl p-10 max-w-lg w-full relative animate-in zoom-in-95 duration-200 shadow-saas-lg">
              <button onClick={() => setModal({ ...modal, open: false })} className="absolute top-6 right-6 text-text-secondary hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-text-primary mb-2 tracking-tight">
                {modal.type === 'interview' ? 'Send interview invites' : 'Send assessment links'}
              </h2>
              <p className="text-text-secondary text-sm mb-8 font-medium">Distributing to {selectedIds.length} selected candidates</p>

              <div className="space-y-6">
                {modal.type === 'interview' ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">Interview date</label>
                        <input type="date" value={modalForm.date} onChange={(e) => setModalForm({...modalForm, date: e.target.value})} className="w-full bg-surface px-4 py-3 border border-border rounded-xl focus:border-primary outline-none text-sm text-text-primary transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">Interview time</label>
                        <input type="time" value={modalForm.time} onChange={(e) => setModalForm({...modalForm, time: e.target.value})} className="w-full bg-surface px-4 py-3 border border-border rounded-xl focus:border-primary outline-none text-sm text-text-primary transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">Meeting link</label>
                      <input type="url" value={modalForm.meetLink} onChange={(e) => setModalForm({...modalForm, meetLink: e.target.value})} placeholder="https://meet.google.com/..." className="w-full bg-surface px-4 py-3 border border-border rounded-xl focus:border-primary outline-none text-sm text-text-primary placeholder-gray-400 transition-all" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">Assessment URL</label>
                      <input type="url" value={modalForm.assessmentUrl} onChange={(e) => setModalForm({...modalForm, assessmentUrl: e.target.value})} placeholder="https://hackerrank.com/..." className="w-full bg-surface px-4 py-3 border border-border rounded-xl focus:border-primary outline-none text-sm text-text-primary placeholder-gray-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary mb-2 uppercase tracking-widest">Deadline date</label>
                      <input type="date" value={modalForm.deadline} onChange={(e) => setModalForm({...modalForm, deadline: e.target.value})} className="w-full bg-surface px-4 py-3 border border-border rounded-xl focus:border-primary outline-none text-sm text-text-primary transition-all" />
                    </div>
                  </>
                )}

                <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 flex items-start gap-4">
                  <Zap className="text-primary mt-0.5 shrink-0" size={16} />
                  <p className="text-[11px] text-text-secondary font-medium leading-relaxed">
                    <span className="text-primary font-bold mr-1 italic underline">AI Agent:</span> 
                    I'll draft personalized invites for each candidate highlighting why they are a great fit for the {jobDetails.title} role.
                  </p>
                </div>

                <button
                  disabled={modal.loading}
                  onClick={handleSend}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-saas"
                >
                  {modal.loading ? <><Loader2 className="animate-spin" size={18} /> Sending...</> : `Send to ${selectedIds.length} candidates`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shortlist;
