import React, { useState, useEffect } from 'react';
import { getPipelineStatus, markResult, addCustomRound, moveCandidate, previewBulkEmail, sendBulkEmail } from '../services/api';
import { Plus, Check, X, Loader2, MoreVertical, Briefcase, Mail, Users, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';

const Pipeline = () => {
  const [jobId, setJobId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingRound, setAddingRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [bulkModal, setBulkModal] = useState({
    open: false,
    round: '',
    kind: '',
    loading: false,
    sending: false,
    preview: null,
    result: null,
    error: null
  });

  useEffect(() => {
    const jId = localStorage.getItem('precisehire_jobId');
    
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

  const mapBulkEmailError = (err) => {
    const status = err?.response?.status;
    if (status === 409) {
      return 'A send is already in progress for this job.';
    }
    if (status === 429) {
      return 'Too many requests. Please try again in a few minutes.';
    }
    if (status === 400) {
      return 'Too many recipients or invalid request.';
    }
    return err?.response?.data?.error || 'Could not send emails. Please try again.';
  };

  const handleOpenBulkModal = async (round) => {
    const kind = round === 'Selected' ? 'selected' : 'rejected';
    setBulkModal({
      open: true,
      round,
      kind,
      loading: true,
      sending: false,
      preview: null,
      result: null,
      error: null
    });

    try {
      const res = await previewBulkEmail({ jobId, kind });
      if (res.data?.success) {
        setBulkModal(prev => ({
          ...prev,
          loading: false,
          preview: res.data
        }));
      } else {
        setBulkModal(prev => ({
          ...prev,
          loading: false,
          error: res.data?.error || 'Could not send emails. Please try again.'
        }));
      }
    } catch (err) {
      setBulkModal(prev => ({
        ...prev,
        loading: false,
        error: mapBulkEmailError(err)
      }));
    }
  };

  const handleSendBulk = async () => {
    setBulkModal(prev => ({ ...prev, sending: true, error: null }));
    try {
      const res = await sendBulkEmail({ jobId, kind: bulkModal.kind });
      if (res.data?.success) {
        setBulkModal(prev => ({
          ...prev,
          sending: false,
          result: res.data
        }));
        fetchStatus(jobId);
      } else {
        setBulkModal(prev => ({
          ...prev,
          sending: false,
          error: res.data?.error || 'Could not send emails. Please try again.'
        }));
      }
    } catch (err) {
      setBulkModal(prev => ({
        ...prev,
        sending: false,
        error: mapBulkEmailError(err)
      }));
    }
  };

  const closeBulkModal = () => {
    setBulkModal({
      open: false,
      round: '',
      kind: '',
      loading: false,
      sending: false,
      preview: null,
      result: null,
      error: null
    });
  };

  const handleResult = async (candidateId, result, currentRound) => {
    const oldData = JSON.parse(JSON.stringify(data));
    const newData = JSON.parse(JSON.stringify(data));
    
    let movedCandidate = null;
    const sourceIdx = (newData.candidatesByRound[currentRound] || []).findIndex(c => c.candidateId === candidateId);
    
    if (sourceIdx !== -1) {
      [movedCandidate] = newData.candidatesByRound[currentRound].splice(sourceIdx, 1);
      
      if (result === 'fail') {
        newData.candidatesByRound['Eliminated'] = [...(newData.candidatesByRound['Eliminated'] || []), movedCandidate];
      } else {
        const rounds = newData.rounds || [];
        const currentIndex = rounds.indexOf(currentRound);
        let nextRound = 'Selected';
        if (currentIndex !== -1 && currentIndex + 1 < rounds.length) {
          const candidateNext = rounds[currentIndex + 1];
          if (candidateNext !== 'Eliminated') {
            nextRound = candidateNext;
          }
        }
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
    } catch {
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
    } catch {
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
      } catch {
        setData(oldData); 
      }
    }
    
    setDraggedCandidateId(null);
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
    <div className="px-8 py-10 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-surface animate-fade-in-up">
      <div className="flex justify-between items-end mb-10 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight mb-1">Hiring pipeline</h1>
          <p className="text-text-secondary text-sm font-medium italic">Manage and track candidate progress through recruitment rounds</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchStatus(jobId)}
            className="p-3 rounded-lg bg-white border border-border text-text-secondary hover:text-primary hover:border-primary/30 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setAddingRound(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold text-xs hover:bg-primary/90 transition-all shadow-saas cursor-pointer"
          >
            <Plus size={16} /> Add round
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max pr-10">
          {(data.rounds || []).map((round) => (
            <div 
              key={round} 
              className="w-80 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, round)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${round === 'Eliminated' ? 'bg-error' : round === 'Selected' ? 'bg-success' : 'bg-primary'}`}></div>
                  <h3 className="font-black text-text-primary text-[10px] uppercase tracking-widest">{round}</h3>
                  <span className="text-[10px] text-text-secondary font-black ml-1">({data.candidatesByRound[round]?.length || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  {(round === 'Selected' || round === 'Eliminated') && (
                    <button
                      type="button"
                      disabled={!(data.candidatesByRound[round]?.length > 0)}
                      onClick={() => handleOpenBulkModal(round)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap ${
                        round === 'Selected'
                          ? 'border-success/30 text-success hover:bg-success hover:text-white bg-success/5'
                          : 'border-error/30 text-error hover:bg-error hover:text-white bg-error/5'
                      }`}
                      title={round === 'Selected' ? 'Send offer mails to selected candidates' : 'Send rejection mails to eliminated candidates'}
                    >
                      <Mail size={12} />
                      <span>{round === 'Selected' ? 'Send offer mails' : 'Send rejection mails'}</span>
                    </button>
                  )}
                  <MoreVertical size={14} className="text-gray-300 cursor-pointer hover:text-text-primary" />
                </div>
              </div>
              
              <div className="flex-1 rounded-xl p-3 overflow-y-auto border border-border bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                <div className="space-y-4 min-h-[200px]" onDragOver={(e) => e.preventDefault()}>
                  {(data.candidatesByRound[round] || []).map((c) => (
                    <div 
                      key={c.candidateId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.candidateId)}
                      onDragEnd={() => setDraggedCandidateId(null)}
                      className="bg-white p-5 rounded-xl border border-border shadow-saas hover:border-primary/30 hover:shadow-saas-lg hover:scale-[1.03] transition-all duration-300 group relative cursor-grab active:cursor-grabbing"
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

                      {round !== 'Selected' && round !== 'Eliminated' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResult(c.candidateId, 'pass', round)}
                            className="flex-1 bg-primary text-white py-2.5 rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-saas uppercase tracking-wider cursor-pointer"
                          >
                            Move forward <ChevronRight size={12} />
                          </button>
                          <button 
                            onClick={() => handleResult(c.candidateId, 'fail', round)}
                            className="w-10 h-10 border border-border text-text-secondary rounded-lg hover:bg-red-50 transition-all flex items-center justify-center shrink-0 hover:text-red-500 hover:border-red-200 cursor-pointer"
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
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1.5">Total pool</p>
          <p className="text-3xl font-black text-text-primary">{data.stats.total}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1.5">In progress</p>
          <p className="text-3xl font-black text-primary">{data.stats.inProgress}</p>
        </div>
        <div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1.5">Rejected</p>
          <p className="text-3xl font-black text-error">{data.stats.eliminated}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1.5">Selected</p>
          <div className="text-4xl font-black text-success">{data.stats.selected}</div>
        </div>
      </div>

      {addingRound && (
        <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-xl p-10 max-w-md w-full relative animate-in zoom-in-95 duration-200 shadow-saas-lg">
            <button onClick={() => setAddingRound(false)} className="absolute top-6 right-6 text-text-secondary hover:text-text-primary cursor-pointer">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-6 tracking-tight uppercase">Add new hiring stage</h2>
            <input 
              autoFocus
              value={newRoundName}
              onChange={(e) => setNewRoundName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRound()}
              placeholder="e.g. Technical Interview"
              className="w-full bg-surface border border-border px-4 py-4 rounded-lg focus:border-primary outline-none mb-8 font-bold text-text-primary text-sm placeholder-gray-400 shadow-sm animate-all"
            />
            <button onClick={handleAddRound} className="w-full bg-primary text-white py-4 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-saas cursor-pointer">
              Create stage
            </button>
          </div>
        </div>
      )}

      {/* Bulk Email Confirmation & Result Modal */}
      {bulkModal.open && (
        <div className="fixed inset-0 bg-text-primary/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-xl p-8 max-w-lg w-full relative animate-in zoom-in-95 duration-200 shadow-saas-lg max-h-[90vh] overflow-y-auto">
            <button 
              onClick={closeBulkModal} 
              disabled={bulkModal.sending}
              className="absolute top-6 right-6 text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${bulkModal.round === 'Selected' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                <Mail size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  Bulk email — {bulkModal.round}
                </h2>
                <p className="text-xs text-text-secondary font-medium">
                  {bulkModal.round === 'Selected' ? 'Send selection notifications to candidates' : 'Send rejection updates to candidates'}
                </p>
              </div>
            </div>

            {bulkModal.loading ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={28} />
                <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Generating email preview...</p>
              </div>
            ) : bulkModal.result ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-2">Send summary</h3>
                  {bulkModal.result.dryRun && (
                    <div className="p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-amber-600" />
                      <span>Dry run: no emails were actually sent</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-surface border border-border p-3.5 rounded-lg">
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Sent</p>
                      <p className="text-2xl font-black text-success">{bulkModal.result.sent ?? 0}</p>
                    </div>
                    <div className="bg-surface border border-border p-3.5 rounded-lg">
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Skipped already sent</p>
                      <p className="text-2xl font-black text-text-secondary">{bulkModal.result.skippedAlreadySent ?? 0}</p>
                    </div>
                    <div className="bg-surface border border-border p-3.5 rounded-lg">
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Skipped invalid</p>
                      <p className="text-2xl font-black text-text-secondary">{bulkModal.result.skippedInvalid ?? 0}</p>
                    </div>
                    <div className="bg-surface border border-border p-3.5 rounded-lg">
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Failed</p>
                      <p className={`text-2xl font-black ${(bulkModal.result.failed ?? 0) > 0 ? 'text-error' : 'text-text-secondary'}`}>
                        {bulkModal.result.failed ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeBulkModal}
                  className="w-full bg-primary text-white py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-saas cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                {bulkModal.error && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-error" />
                    <span className="flex-1">{bulkModal.error}</span>
                  </div>
                )}

                {bulkModal.preview && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-surface border border-border p-3.5 rounded-lg">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">To email</p>
                        <p className="text-2xl font-black text-primary">{bulkModal.preview.toSend}</p>
                      </div>
                      <div className="bg-surface border border-border p-3.5 rounded-lg">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Already emailed</p>
                        <p className="text-2xl font-black text-text-secondary">{bulkModal.preview.alreadySent}</p>
                      </div>
                    </div>

                    {bulkModal.preview.toSend === 0 ? (
                      <div className="p-5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-secondary text-center mb-6">
                        Everyone in this column has already been emailed
                      </div>
                    ) : (
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
                            Sample subject
                          </label>
                          <div className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-lg text-xs font-bold text-text-primary">
                            {bulkModal.preview.sample?.subject || '—'}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
                            Sample text
                          </label>
                          <div className="w-full bg-surface border border-border px-3.5 py-2.5 rounded-lg text-xs text-text-primary font-medium whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                            {bulkModal.preview.sample?.text || '—'}
                          </div>
                          <p className="text-[11px] text-text-secondary italic mt-1.5">
                            Each candidate's name will replace the greeting
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeBulkModal}
                        disabled={bulkModal.sending}
                        className="flex-1 py-3.5 px-4 rounded-lg border border-border bg-white text-text-secondary hover:bg-surface font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      {bulkModal.preview.toSend > 0 && (
                        <button
                          type="button"
                          onClick={handleSendBulk}
                          disabled={bulkModal.sending}
                          className="flex-1 bg-primary text-white py-3.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-saas flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bulkModal.sending ? (
                            <>
                              <Loader2 className="animate-spin" size={14} />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <span>Send to {bulkModal.preview.toSend} candidates</span>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
