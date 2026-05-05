import React, { useState, useRef } from 'react';
import { uploadCandidates } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const AdminApp = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '', details: null });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls'))) {
      setFile(selected);
      setStatus({ type: '', message: '' });
    } else {
      setStatus({ type: 'error', message: 'Please select a valid Excel file (.xlsx or .xls)' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await uploadCandidates(formData);
      if (data.success) {
        setStatus({
          type: 'success',
          message: `Successfully imported ${data.count} candidates!`,
          details: data
        });
        localStorage.setItem('precisehire_jobId', data.jobId);
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      setStatus({ type: 'error', message: e.response?.data?.error || e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-20 max-w-xs mx-auto relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-border -translate-y-1/2"></div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-saas">1</div>
            <span className="text-[10px] font-bold mt-2 text-text-primary uppercase tracking-wider">Upload</span>
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-white text-text-secondary flex items-center justify-center text-xs font-bold border border-border">2</div>
            <span className="text-[10px] font-bold mt-2 text-text-secondary uppercase tracking-wider">Screening</span>
          </div>
          <div className="flex flex-col items-center relative z-10">
            <div className="w-8 h-8 rounded-full bg-white text-text-secondary flex items-center justify-center text-xs font-bold border border-border">3</div>
            <span className="text-[10px] font-bold mt-2 text-text-secondary uppercase tracking-wider">Shortlist</span>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl shadow-saas-lg overflow-hidden relative">
          <div className="p-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-text-primary mb-2 tracking-tight">Import candidates</h2>
              <p className="text-text-secondary text-sm font-medium">Start your recruitment cycle by uploading a candidate sheet.</p>
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer group/upload ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-surface'}`}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
                  setFile(f);
                  setStatus({ type: '', message: '' });
                }
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/20">
                    <FileSpreadsheet size={32} />
                  </div>
                  <p className="text-lg font-bold text-text-primary">{file.name}</p>
                  <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Ready to import
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-text-secondary mb-4 border border-border transition-all group-hover/upload:scale-110 group-hover/upload:text-primary group-hover/upload:border-primary/30">
                    <Upload size={32} />
                  </div>
                  <p className="text-lg font-bold text-text-primary">Select Excel file</p>
                  <p className="text-xs text-text-secondary mt-2 font-medium">or drag and drop here</p>
                </div>
              )}
            </div>

            <div className="mt-12 flex flex-col items-center">
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`w-full max-w-sm py-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] ${!file || loading ? 'bg-surface text-text-secondary cursor-not-allowed border border-border' : 'bg-primary text-white hover:bg-primary/90 shadow-saas'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Processing spreadsheet...
                  </div>
                ) : 'Import candidates'}
              </button>
              <div className="mt-8 flex items-center gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                <span className="text-gray-300">Requires:</span>
                <span>Name</span>
                <span>Email</span>
                <span>Resume Link</span>
              </div>
            </div>
          </div>

          {status.type === 'success' && (
            <div className="bg-primary/5 p-12 border-t border-border animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center text-success font-bold text-lg mb-8">
                <CheckCircle2 size={24} className="mr-3" />
                {status.message}
              </div>
              
              <div className="bg-white border border-border rounded-2xl overflow-hidden mb-10 shadow-saas">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-border">
                    <tr className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {status.details.candidates.slice(0, 5).map((c, i) => (
                      <tr key={i} className="hover:bg-surface transition-colors">
                        <td className="px-6 py-5 font-bold text-text-primary">{c.name}</td>
                        <td className="px-6 py-5 text-text-secondary font-medium">{c.email}</td>
                        <td className="px-6 py-5 text-primary truncate max-w-[200px] font-bold text-xs uppercase tracking-tight">{c.resumeLink}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => navigate('/screening')}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center group shadow-saas"
              >
                Proceed to AI screening <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {status.type === 'error' && (
            <div className="bg-red-50 p-8 border-t border-red-100 flex items-start text-red-600 animate-in fade-in duration-300">
              <AlertCircle size={20} className="mr-4 mt-1" />
              <div>
                <p className="font-bold text-sm mb-1 uppercase tracking-tight">Import failed</p>
                <p className="text-sm text-red-500 font-medium">{status.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApp;
