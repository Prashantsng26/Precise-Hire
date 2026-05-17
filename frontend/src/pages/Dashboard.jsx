import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { Users, Star, Briefcase, Zap, Plus, ArrowRight, TrendingUp, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const mockHistoricalData = [
  { name: 'Jan', candidates: 120, avgScore: 65 },
  { name: 'Feb', candidates: 150, avgScore: 72 },
  { name: 'Mar', candidates: 180, avgScore: 68 },
  { name: 'Apr', candidates: 220, avgScore: 75 },
  { name: 'May', candidates: 280, avgScore: 82 },
  { name: 'Jun', candidates: 350, avgScore: 85 }
];

const pipelineData = [
  { name: 'In Review', value: 45, color: '#9CA3AF' },
  { name: 'Shortlisted', value: 30, color: '#3B82F6' },
  { name: 'Interviewing', value: 15, color: '#8B5CF6' },
  { name: 'Offered', value: 10, color: '#10B981' }
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getDashboardStats();
        if (data.success) {
          setStats(data);
        }
      } catch (e) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-[calc(100vh-64px)] bg-surface">
      <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  if (!stats || stats.totalCandidates === 0) return (
    <div className="max-w-4xl mx-auto px-4 py-32 text-center bg-surface min-h-screen">
      <div className="bg-white border border-border rounded-[2rem] p-16 inline-block shadow-saas">
        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center text-text-secondary mx-auto mb-8 border border-border">
          <Users size={32} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">No hiring data yet</h2>
        <p className="text-text-secondary mb-10 max-w-sm mx-auto text-sm leading-relaxed font-medium">
          Start your recruitment cycle by uploading your first candidate list and let AI do the heavy lifting.
        </p>
        <button
          onClick={() => navigate('/app')}
          className="rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95 flex items-center gap-2 mx-auto"
        >
          <Plus size={18} /> Start recruiting
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Welcome back, Admin</h1>
            <p className="text-text-secondary text-sm font-medium">Here is your hiring activity at a glance.</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} /> New recruitment
          </button>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-border p-8 rounded-2xl shadow-saas hover:shadow-saas-lg transition-all group">
            <div className="flex items-center gap-3 mb-6 text-text-secondary">
              <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/5 transition-colors">
                <Users size={16} className="group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Total candidates</span>
            </div>
            <p className="text-4xl font-bold text-text-primary mb-1">{stats.totalCandidates}</p>
            <p className="text-text-secondary text-xs font-medium">Across all job roles</p>
          </div>

          <div className="bg-white border border-border p-8 rounded-2xl shadow-saas hover:shadow-saas-lg transition-all group">
            <div className="flex items-center gap-3 mb-6 text-text-secondary">
              <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/5 transition-colors">
                <Star size={16} className="group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Average ATS score</span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <p className="text-4xl font-bold text-text-primary">{stats.avgScore}</p>
              <span className="text-text-secondary text-sm font-bold">/100</span>
            </div>
            <p className="text-text-secondary text-xs font-medium">Based on AI evaluation</p>
          </div>

          <div className="bg-white border border-border p-8 rounded-2xl shadow-saas hover:shadow-saas-lg transition-all group">
            <div className="flex items-center gap-3 mb-6 text-text-secondary">
              <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/5 transition-colors">
                <Briefcase size={16} className="group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">Active jobs</span>
            </div>
            <p className="text-4xl font-bold text-text-primary mb-1">{stats.activeJobs}</p>
            <p className="text-text-secondary text-xs font-medium">Recruitment cycles running</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Pie Chart */}
          <div className="bg-white border border-border rounded-2xl shadow-saas overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <PieChartIcon size={18} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Pipeline Distribution</h3>
            </div>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-5">
                <div className="text-center">
                  <p className="text-3xl font-black text-text-primary">100%</p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-border rounded-2xl shadow-saas overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart2 size={18} />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Candidates by Role</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.recentJobs.length > 0 ? stats.recentJobs.slice(0, 5) : mockHistoricalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} tickFormatter={(val) => val ? (val.length > 10 ? val.substring(0, 10) + '...' : val) : ''} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  <Bar dataKey="totalCandidates" name="Candidates" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Table Section */}
          <div className="lg:col-span-2 bg-white border border-border rounded-2xl shadow-saas overflow-hidden">
            <div className="px-8 py-5 border-b border-border flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-text-primary">Recent recruitment cycles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-secondary text-[10px] font-bold border-b border-border bg-surface uppercase tracking-wider">
                    <th className="px-8 py-4">Job role</th>
                    <th className="px-8 py-4">Created</th>
                    <th className="px-8 py-4 text-center">Candidates</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentJobs.map((job) => (
                    <tr key={job.jobId} className="hover:bg-surface transition-all group">
                      <td className="px-8 py-6">
                        <p className="font-bold text-text-primary">{job.title}</p>
                      </td>
                      <td className="px-8 py-6 text-text-secondary text-xs font-medium">
                        {new Date(job.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-surface rounded-full text-[10px] font-bold border border-border text-text-secondary group-hover:bg-white group-hover:text-primary group-hover:border-primary/20 transition-all">
                          {job.totalCandidates}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => {
                            localStorage.setItem('precisehire_jobId', job.jobId);
                            navigate('/shortlist');
                          }}
                          className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          View shortlist <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="lg:col-span-1 bg-white border border-border rounded-2xl shadow-saas overflow-hidden">
            <div className="px-8 py-5 border-b border-border bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Zap size={16} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">AI insights</h3>
              </div>
            </div>
            
            <div className="p-8 space-y-8 bg-white">
              <div className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Candidate trend</div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">Most candidates in your current pipeline have strong Backend Developer skills and experience with AWS.</p>
              </div>
              <div className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Action needed</div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">Move candidates from "Technical Round" to "Verbal Round" to maintain hiring momentum.</p>
              </div>
              <div className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Score update</div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">The current average ATS score is 12% higher than last month's average, indicating higher quality applicant pool.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
