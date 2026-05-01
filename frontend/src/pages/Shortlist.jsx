import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getShortlist, sendInterviewInvites, sendAssessmentLinks, createPipeline } from '../services/api';
import { Trophy, Mail, FileCheck, ArrowRight, Loader2, CheckSquare, Square, X, Calendar, Clock, Link, Send } from 'lucide-react';

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

  useEffect(() => {
    const jId = localStorage.getItem('precisehire_jobId');
    const w = JSON.parse(localStorage.getItem('precisehire_weightage') || '{}');
    const d = JSON.parse(localStorage.getItem('precisehire_jobDetails') || '{}');
    
    if (!jId) {
      navigate('/app');
      return;
    }
    
    setJobId(jId);
    setWeightage(w);
    setJobDetails(d);

    const fetchShortlist = async () => {
      try {
        const { data } = await getShortlist(jId);
        if (data.success) {
          setCandidates(data.candidates);
        }
      } catch (e) {
        console.error('Fetch failed');
      } finally {
        setLoading(false);
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
    try {
      const { data } = await createPipeline({ jobId, candidateIds: selectedIds });
      if (data.success) navigate('/pipeline');
    } catch (e) {
      console.error('Pipeline move failed');
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-gray-500 font-medium">Fetching ranked candidates...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative pb-24">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-12 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
          <span className="text-xs font-bold mt-2 text-green-500">Upload</span>
        </div>
        <div className="h-0.5 w-24 bg-green-500"></div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
          <span className="text-xs font-bold mt-2 text-green-500">Screening</span>
        </div>
        <div className="h-0.5 w-24 bg-blue-600"></div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
          <span className="text-xs font-bold mt-2 text-blue-600">Shortlist</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{jobDetails.title} Shortlist</h1>
          <p className="text-gray-500 mt-1 font-medium">Showing {candidates.length} ranked candidates</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-tighter">Skills {weightage.skills}%</span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-tighter">Experience {weightage.experience}%</span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 uppercase tracking-tighter">Quality {weightage.quality}%</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">
                <button onClick={toggleAll} className="text-gray-400 hover:text-blue-600">
                  {selectedIds.length === candidates.length && candidates.length > 0 ? <CheckSquare className="text-blue-600" /> : <Square />}
                </button>
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Skills %</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Exp %</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Quality %</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total Score</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {candidates.map((c, idx) => (
              <tr key={c.candidateId} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.includes(c.candidateId) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <button onClick={() => toggleSelect(c.candidateId)} className="text-gray-400 hover:text-blue-600">
                    {selectedIds.includes(c.candidateId) ? <CheckSquare className="text-blue-600" /> : <Square />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  {idx === 0 ? <Trophy className="text-yellow-500" /> : 
                   idx === 1 ? <Trophy className="text-gray-400" /> :
                   idx === 2 ? <Trophy className="text-amber-600" /> :
                   <span className="text-gray-400 font-bold ml-1">#{idx + 1}</span>}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${(c.skills_score || 0) >= 80 ? 'bg-green-50 text-green-700 border-green-200' : (c.skills_score || 0) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {(c.skills_score || 0)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${(c.experience_score || 0) >= 80 ? 'bg-green-50 text-green-700 border-green-200' : (c.experience_score || 0) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {(c.experience_score || 0)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${(c.quality_score || 0) >= 80 ? 'bg-green-50 text-green-700 border-green-200' : (c.quality_score || 0) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {(c.quality_score || 0)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-lg font-black text-blue-600">
                    {(c.weighted_score || 0).toFixed(1)} <span className="text-[10px] text-gray-400 font-bold">/ 100</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">Qualified</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-6 z-40 slide-up">
          <div className="px-4 border-r border-gray-700">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Selection</p>
            <p className="text-lg font-black text-white">{selectedIds.length} <span className="text-sm font-normal text-gray-400">candidates</span></p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleAction('interview')} className="flex items-center gap-2 hover:bg-gray-800 px-4 py-2 rounded-xl transition-all font-bold text-sm">
              <Calendar size={18} className="text-blue-400" /> Interview
            </button>
            <button onClick={() => handleAction('assessment')} className="flex items-center gap-2 hover:bg-gray-800 px-4 py-2 rounded-xl transition-all font-bold text-sm">
              <FileCheck size={18} className="text-purple-400" /> Assessment
            </button>
            <button onClick={moveToPipeline} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95 text-sm ml-4">
              Move to Pipeline <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl scale-up relative overflow-hidden">
            <button onClick={() => setModal({ ...modal, open: false })} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2 truncate pr-12">
              {modal.type === 'interview' ? 'Send Interview Invites' : 'Distribution Assessment'}
            </h2>
            <p className="text-gray-500 mb-8 font-medium">Selected: {selectedIds.length} candidates</p>

            <div className="space-y-6">
              {modal.type === 'interview' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="date" value={modalForm.date} onChange={(e) => setModalForm({...modalForm, date: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="time" value={modalForm.time} onChange={(e) => setModalForm({...modalForm, time: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Google Meet Link</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="url" value={modalForm.meetLink} onChange={(e) => setModalForm({...modalForm, meetLink: e.target.value})} placeholder="https://meet.google.com/..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Assessment URL</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="url" value={modalForm.assessmentUrl} onChange={(e) => setModalForm({...modalForm, assessmentUrl: e.target.value})} placeholder="https://hackerrank.com/..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Deadline Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input type="date" value={modalForm.deadline} onChange={(e) => setModalForm({...modalForm, deadline: e.target.value})} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </>
              )}

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                <div className="bg-blue-600 text-white rounded-lg p-1">
                  <Send size={16} />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <b>AI Assistant:</b> Llama 3.1 70B will now write a personalized email for each candidate using their resume details and your job requirements. This may take a few moments.
                </p>
              </div>

              <button
                disabled={modal.loading}
                onClick={handleSend}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl transition-all disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
              >
                {modal.loading ? <><Loader2 className="animate-spin" /> Distributing...</> : `Send to ${selectedIds.length} Candidates`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shortlist;
