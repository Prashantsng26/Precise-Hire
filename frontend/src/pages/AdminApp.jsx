import React, { useState, useRef } from 'react';
import { uploadCandidates } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-12 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
          <span className="text-xs font-bold mt-2 text-blue-600">Upload</span>
        </div>
        <div className="h-0.5 w-24 bg-gray-200"></div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold">2</div>
          <span className="text-xs font-medium mt-2 text-gray-400">Screening</span>
        </div>
        <div className="h-0.5 w-24 bg-gray-200"></div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center font-bold">3</div>
          <span className="text-xs font-medium mt-2 text-gray-400">Shortlist</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Import Candidates</h2>
          
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
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
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-16 w-16 text-blue-600 mb-4" />
                <p className="text-lg font-bold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500 mt-2">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg font-bold text-gray-900">Drag and drop Excel file here</p>
                <p className="text-sm text-gray-500 mt-2">or click to browse from disk</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${!file || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : 'Import Candidates'}
            </button>
            <p className="mt-4 text-sm text-gray-400">
              Required columns: <b>Name, Email, Resume Link</b>. Optional: Phone, LinkedIn
            </p>
          </div>
        </div>

        {status.type === 'success' && (
          <div className="bg-green-50 p-8 border-t border-green-100 slide-up">
            <div className="flex items-center text-green-700 font-bold text-lg mb-6">
              <CheckCircle2 className="mr-2" /> {status.message}
            </div>
            
            <div className="bg-white rounded-lg border border-green-200 overflow-hidden mb-8">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-bold text-gray-700">Name</th>
                    <th className="px-4 py-3 font-bold text-gray-700">Email</th>
                    <th className="px-4 py-3 font-bold text-gray-700">Resume Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {status.details.candidates.map((c, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.email}</td>
                      <td className="px-4 py-3 text-blue-500 truncate max-w-[200px] font-medium">{c.resumeLink}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {status.details.count > 5 && (
                <div className="p-3 bg-gray-50 text-center text-xs text-gray-400 italic font-medium">
                  + {status.details.count - 5} more candidates imported
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/screening')}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg transition-all flex items-center justify-center"
            >
              Proceed to AI Screening <CheckCircle2 className="ml-2" />
            </button>
          </div>
        )}

        {status.type === 'error' && (
          <div className="bg-red-50 p-6 border-t border-red-100 flex items-start text-red-700 animate-shake">
            <AlertCircle className="mr-3 mt-1 flex-shrink-0" />
            <div>
              <p className="font-bold">Import Failed</p>
              <p className="text-sm">{status.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApp;
