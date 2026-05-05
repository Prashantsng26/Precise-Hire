import React, { useState, useEffect } from 'react';
import { getPipelineStatus, markResult, addCustomRound, moveCandidate, sendOfferLetters } from '../services/api';
import { Plus, Check, X, Loader2, MoreVertical, Briefcase, Mail, Users, Send, RefreshCw, ChevronRight } from 'lucide-react';

const Pipeline = () => {
  const [jobId, setJobId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingRound, setAddingRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(null);
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [jobTitle, setJobTitle] = useState('Position');

  useEffect(() => {
    const jId = localStorage.getItem('precisehire_jobId');
    const details = JSON.parse(localStorage.getItem('precisehire_jobDetails') || '{}');
    if (details.title) setJobTitle(details.title);
    
    if (!jId) {
      setLoading(false);
      return;
    }
    setJobId(jId);
    fetchStatus(jId);
  }, []);

  const fetchStatus = async (jId) => {
    try {
      const targetId = jId || jobId;
      const res = await getPipelineStatus(targetId);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error('[PIPELINE] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (candidateId, result, currentRound) => {
    const oldData = JSON.parse(JSON.stringify(data));
    const newData = JSON.parse(JSON.stringify(data));
    
    let movedCandidate = null;
    const sourceIdx = newData.candidatesByRound[currentRound].findIndex(c => c.candidateId === candidateId);
    
    if (sourceIdx !== -1) {
      [movedCandidate] = newData.candidatesByRound[currentRound].splice(sourceIdx, 1);
      
      if (result === 'fail') {
        newData.candidatesByRound['Eliminated'].push(movedCandidate);
      } else {
        const rounds = newData.rounds;
        const nextRound = rounds[rounds.indexOf(currentRound) + 1] || 'Selected';
        newData.candidatesByRound[nextRound] = [...(newData.candidatesByRound[nextRound] || []), movedCandidate];
      }
      setData(newData);
    }

    try {
      const res = await markResult({ candidateId, jobId, result, currentRound });
      if (res.data.success) {
        setData(res.data);
      } else {
        setData(oldData);
      }
    } catch (e) {
      setData(oldData);
    }
  };

  const handleAddRound = async () => {
    if (!newRoundName.trim()) return;
    try {
      const res = await addCustomRound({ jobId, roundName: newRoundName });
      if (res.data.success) {
        setNewRoundName('');
        setAddingRound(false);
        setData(res.data);
      }
    } catch (e) {
      alert('Error adding round');
    }
  };

  const handleDragStart = (e, candidateId) => {
    setDraggedCandidateId(candidateId);
    e.dataTransfer.setData('text/plain', candidateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetRound) => {
    e.preventDefault();
    const candidateId = draggedCandidateId || e.dataTransfer.getData('text/plain');
    if (!candidateId) return;

    const oldData = JSON.parse(JSON.stringify(data));
    const newData = JSON.parse(JSON.stringify(data));
    
    let movedCandidate = null;
    let sourceRound = '';
    
    Object.keys(newData.candidatesByRound).forEach(round => {
      const idx = newData.candidatesByRound[round].findIndex(c => c.candidateId === candidateId);
      if (idx !== -1) {
        sourceRound = round;
        [movedCandidate] = newData.candidatesByRound[round].splice(idx, 1);
      }
    });

    if (movedCandidate && sourceRound !== targetRound) {
      movedCandidate.currentRound = targetRound;
      newData.candidatesByRound[targetRound] = [...(newData.candidatesByRound[targetRound] || []), movedCandidate];
      setData(newData);
      
      try {
        const res = await moveCandidate({ candidateId, jobId, targetRound });
        if (res.data.success) {
          setData(res.data); 
        }
      } catch (e) {
        setData(oldData); 
      }
    }
    
    setDraggedCandidateId(null);
  };

  const handleSendEmail = async (candidate) => {
    setSendingEmail(candidate.candidateId);
    try {
      const payload = {
        candidates: [candidate],
        details: {
          jobTitle: jobTitle,
          joiningDate: 'Next Monday'
        }
      };
      
      const res = await sendOfferLetters(payload);
      if (res.data.success) {
        alert(`Success! Offer letter sent to ${candidate.email}`);
      } else {
        alert('Failed: ' + (res.data.error || 'Server error'));
      }
    } catch (e) {
      console.error('Email send failed:', e);
      alert('Failed to send email. Check if SES is configured correctly.');
    } finally {
      setSendingEmail(null);
    }
  };

  if (loading && !data) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] bg-surface">
      <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest">Syncing pipeline...</p>
    </div>
  );

  if (!jobId || !data) return (
    <div className="max-w-4xl mx-auto px-4 py-32 text-center bg-surface min-h-screen">
      <div className="bg-white border border-border rounded-[2rem] p-16 inline-block shadow-saas">
        <h2 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">No active pipeline found</h2>
        <p className="text-text-secondary mb-10 max-w-sm mx-auto text-sm leading-relaxed font-medium">Please start a recruitment cycle from the admin app first.</p>
        <button onClick={() => window.location.href='/app'} className="rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95">Go to Admin app</button>
      </div>
    </div>
  );

  return (
    <div className="px-8 py-12 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-surface">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Hiring pipeline</h1>
          <p className="text-text-secondary text-sm font-medium italic">Manage and track candidate progress through recruitment rounds</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchStatus(jobId)}
            className="p-3 rounded-xl bg-white border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setAddingRound(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-xs hover:bg-primary/90 transition-all shadow-saas"
          >
            <Plus size={16} /> Add round
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max pr-10">
          {[...data.rounds, 'Eliminated'].map((round) => (
            <div 
              key={round} 
              className="w-80 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, round)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${round === 'Eliminated' ? 'bg-red-500' : round === 'Selected' ? 'bg-success' : 'bg-primary'}`}></div>
                  <h3 className="font-bold text-text-primary text-[10px] uppercase tracking-widest">{round}</h3>
                  <span className="text-[10px] text-text-secondary font-black ml-1">({data.candidatesByRound[round]?.length || 0})</span>
                </div>
                <MoreVertical size={14} className="text-gray-300 cursor-pointer hover:text-text-primary" />
              </div>
              
              <div className="flex-1 rounded-2xl p-3 overflow-y-auto border border-border bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                <div className="space-y-4 min-h-[200px]" onDragOver={(e) => e.preventDefault()}>
                  {(data.candidatesByRound[round] || []).map((c) => (
                    <div 
                      key={c.candidateId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.candidateId)}
                      onDragEnd={() => setDraggedCandidateId(null)}
                      className="bg-white p-5 rounded-xl border border-border shadow-saas hover:border-primary/30 hover:shadow-saas-lg transition-all group relative cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-text-primary font-bold text-sm shrink-0 group-hover:border-primary/40 transition-colors">
                          {c.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary text-sm truncate leading-none mb-1.5">{c.name}</p>
                          <p className="text-[10px] text-text-secondary truncate font-medium">{c.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        <div className="px-2 py-0.5 bg-surface rounded border border-border text-[9px] font-bold text-text-secondary uppercase tracking-tighter">
                          {c.role || 'Other'}
                        </div>
                        {c.weighted_score && (
                          <div className="px-2 py-0.5 bg-primary/5 rounded border border-primary/10 text-[9px] font-black text-primary">
                            SCORE {c.weighted_score.toFixed(0)}
                          </div>
                        )}
                      </div>

                      {round === 'Selected' ? (
                        <button 
                          onClick={() => handleSendEmail(c)}
                          disabled={sendingEmail === c.candidateId}
                          className="w-full bg-success text-white py-2.5 rounded-lg text-[10px] font-bold hover:bg-success/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {sendingEmail === c.candidateId ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                          SEND OFFER LETTER
                        </button>
                      ) : round !== 'Eliminated' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResult(c.candidateId, 'pass', round)}
                            className="flex-1 bg-primary text-white py-2.5 rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-saas uppercase tracking-wider"
                          >
                            Move forward <ChevronRight size={12} />
                          </button>
                          <button 
                            onClick={() => handleResult(c.candidateId, 'fail', round)}
                            className="w-10 h-10 border border-border text-text-secondary rounded-lg hover:bg-red-50 transition-all flex items-center justify-center shrink-0 hover:text-red-500 hover:border-red-200"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!data.candidatesByRound[round] || data.candidatesByRound[round].length === 0) && (
                    <div className="py-16 text-center flex flex-col items-center gap-3 opacity-20">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-text-secondary flex items-center justify-center text-text-secondary">
                        <Users size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Empty stage</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-16 border-t border-border pt-10 shrink-0 bg-white px-10 py-6 -mx-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1.5">Total pool</p>
          <p className="text-3xl font-black text-text-primary">{data.stats.total}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1.5">In progress</p>
          <p className="text-3xl font-black text-primary">{data.stats.inProgress}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1.5">Rejected</p>
          <p className="text-3xl font-black text-red-500">{data.stats.eliminated}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-1.5">Selected</p>
          <div className="text-4xl font-black text-success">{data.stats.selected}</div>
        </div>
      </div>

      {addingRound && (
        <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-2xl p-10 max-w-md w-full relative animate-in zoom-in-95 duration-200 shadow-saas-lg">
            <button onClick={() => setAddingRound(false)} className="absolute top-6 right-6 text-text-secondary hover:text-text-primary">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-6 tracking-tight">Add new hiring stage</h2>
            <input 
              autoFocus
              value={newRoundName}
              onChange={(e) => setNewRoundName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRound()}
              placeholder="e.g. Technical Interview"
              className="w-full bg-surface border border-border px-4 py-4 rounded-xl focus:border-primary outline-none mb-8 font-bold text-text-primary text-sm placeholder-gray-400 shadow-sm"
            />
            <button onClick={handleAddRound} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-saas">
              Create stage
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
