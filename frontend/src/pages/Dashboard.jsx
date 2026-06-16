import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { Users, Star, Briefcase, Zap, Plus, ArrowRight, TrendingUp, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LabelList } from 'recharts';

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
  { name: 'Shortlisted', value: 30, color: '#2563EB' },
  { name: 'Interviewing', value: 15, color: '#F59E0B' },
  { name: 'Offered', value: 10, color: '#16A34A' }
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
    <div className="max-w-4xl mx-auto px-4 py-40 text-center bg-surface min-h-screen">
      <div className="bg-white border border-border rounded-xl p-10 md:p-20 inline-block shadow-saas hover:scale-[1.01] transition-all duration-300">
        <div className="w-16 h-16 bg-surface rounded-lg flex items-center justify-center text-text-secondary mx-auto mb-8 border border-border">
          <Users size={32} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3 tracking-tight">No hiring data yet</h2>
        <p className="text-text-secondary mb-10 max-w-sm mx-auto text-sm leading-relaxed font-medium">
          Start your recruitment cycle by uploading your first candidate list and let AI do the heavy lifting.
        </p>
        <button
          onClick={() => navigate('/app')}
          className="rounded-lg bg-primary px-8 py-4 text-sm font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
        >
          <Plus size={18} /> Start recruiting
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen pb-20 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-10">
          <div>
            <h1 className="text-3xl font-black text-text-primary tracking-tight mb-1">Welcome back, Admin</h1>
            <p className="text-text-secondary text-sm font-medium">Here is your hiring activity at a glance.</p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-saas hover:bg-primary/90 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={18} /> New recruitment
          </button>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div className="bg-white border border-border p-10 rounded-xl shadow-saas hover:shadow-saas-lg hover:scale-[1.02] transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-6 text-text-secondary">
              <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/5 transition-colors">
                <Users size={16} className="group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider">Total candidates</span>
            </div>
            <p className="text-4xl font-black text-text-primary mb-1">{stats.totalCandidates}</p>
            <p className="text-text-secondary text-xs font-medium">Across all job roles</p>
          </div>

          <div className="bg-white border border-border p-10 rounded-xl shadow-saas hover:shadow-saas-lg hover:scale-[1.02] transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-6 text-text-secondary">
              <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/5 transition-colors">
                <Star size={16} className="group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider">Average ATS score</span>
            </div>
            {stats.avgScore < 30 ? (
              <div className="flex flex-col gap-1 mb-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-text-primary">{stats.avgScore}</p>
                  <span className="text-text-secondary text-sm font-bold">/100</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md w-fit border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">Run screening to improve scores</span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-4xl font-black text-text-primary">{stats.avgScore}</p>
                <span className="text-text-secondary text-sm font-bold">/100</span>
              </div>
            )}
            <p className="text-text-secondary text-xs font-medium mt-1">Based on AI evaluation</p>
          </div>

          <div className="bg-white border border-border p-10 rounded-xl shadow-saas hover:shadow-saas-lg hover:scale-[1.02] transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-6 text-text-secondary">
              <div className="p-2 bg-surface rounded-lg group-hover:bg-primary/5 transition-colors">
                <Briefcase size={16} className="group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider">Active jobs</span>
            </div>
            <p className="text-4xl font-black text-text-primary mb-1">{stats.activeJobs}</p>
            <p className="text-text-secondary text-xs font-medium">Recruitment cycles running</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Pie Chart */}
          <div className="bg-white border border-border rounded-xl shadow-saas overflow-hidden p-10 transition-all duration-300 hover:shadow-saas-lg hover:scale-[1.01]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <PieChartIcon size={18} />
              </div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Pipeline Distribution</h3>
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
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-5">
                <div className="text-center">
                  <p className="text-3xl font-black text-text-primary">{stats.totalCandidates}</p>
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">In Pipeline</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-border rounded-xl shadow-saas overflow-hidden p-10 transition-all duration-300 hover:shadow-saas-lg hover:scale-[1.01]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart2 size={18} />
              </div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Candidates by Role</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={Object.values(stats.recentJobs.reduce((acc, job) => {
                    const role = job.role || job.title;
                    if (!acc[role]) acc[role] = { role, count: 0 };
                    acc[role].count += job.totalCandidates;
                    return acc;
                  }, {})).slice(0, 5)} 
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="role" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  <Bar dataKey="count" name="Candidates" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: '11px', fill: '#475569', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Table Section */}
          <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-saas overflow-hidden transition-all duration-300 hover:shadow-saas-lg hover:scale-[1.01]">
            <div className="px-8 py-5 border-b border-border flex justify-between items-center bg-white">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Recent Jobs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-text-secondary text-[10px] font-bold border-b border-border bg-surface uppercase tracking-wider">
                    <th className="px-8 py-4">Job Details</th>
                    <th className="px-8 py-4 text-center">Candidates</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentJobs.map((job) => (
                    <tr key={job.jobId} className="hover:bg-primary/5 transition-all group">
                      <td className="px-8 py-5">
                        <p className="font-bold text-text-primary text-[13px]">{job.title}</p>
                        <p className="text-text-secondary text-[10px] font-medium mt-1">
                          Created {new Date(job.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="px-3 py-1 bg-primary/5 rounded-full text-[10px] font-bold border border-primary/10 text-primary">
                          {job.totalCandidates} candidates
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => {
                            localStorage.setItem('precisehire_jobId', job.jobId);
                            navigate('/shortlist');
                          }}
                          className="px-4 py-2 bg-white border border-border rounded-lg text-[11px] font-bold text-text-primary hover:bg-surface transition-all ml-auto cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="lg:col-span-1 bg-white border border-border rounded-xl shadow-saas overflow-hidden transition-all duration-300 hover:shadow-saas-lg hover:scale-[1.01]">
            <div className="px-8 py-5 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Zap size={16} />
                </div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">AI insights</h3>
              </div>
            </div>
            
            <div className="p-10 space-y-10 bg-white">
              <div className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <div className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">Volume Overview</div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {stats.totalCandidates} total candidates across {stats.activeJobs} active jobs.
                </p>
              </div>
              <div className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <div className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">Top Hiring Role</div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  Most common role: {stats.recentJobs.length > 0 ? (stats.recentJobs.reduce((prev, current) => (prev.totalCandidates > current.totalCandidates) ? prev : current).role || stats.recentJobs[0].title) : "N/A"}.
                </p>
              </div>
              <div className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-colors">
                <div className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">Quality Score</div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  Average score: {stats.avgScore}/100 — {stats.avgScore >= 60 ? "Good" : "Needs Improvement"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
