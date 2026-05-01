import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { Users, Star, Briefcase, Lightbulb, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="flex justify-center items-center h-[calc(100vh-64px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!stats || stats.totalCandidates === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-12 inline-block">
        <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No data yet.</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">Upload candidates to begin your first AI-powered recruitment cycle.</p>
        <button
          onClick={() => navigate('/app')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Start Recruiting
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Recruitment Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="bg-blue-100 p-4 rounded-lg mr-4 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Candidates</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="bg-yellow-100 p-4 rounded-lg mr-4 text-yellow-600">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Average ATS Score</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgScore} <span className="text-sm font-normal text-gray-400">/ 100</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="bg-green-100 p-4 rounded-lg mr-4 text-green-600">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Active Jobs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Recent Recruitment Cycles</h3>
              <button className="text-sm text-blue-600 font-semibold hover:underline flex items-center">
                View all <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {stats.recentJobs.map((job) => (
                <div key={job.jobId} className="p-4 hover:bg-gray-50 cursor-pointer transition" onClick={() => {
                  localStorage.setItem('precisehire_jobId', job.jobId);
                  navigate('/pipeline');
                }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-400 mt-1">Created on {new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700">{job.totalCandidates} Candidates</p>
                      <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded mt-1 uppercase">
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center mb-4">
              <Lightbulb className="mr-2" />
              <h3 className="font-bold text-lg">AI Insights</h3>
            </div>
            <ul className="space-y-4 text-sm">
              <li className="bg-blue-500 bg-opacity-30 p-3 rounded-lg border border-blue-400">
                <p className="font-semibold mb-1">High Intent Pool</p>
                <p className="text-blue-100">Most candidates in your current pipeline have strong Backend Developer skills.</p>
              </li>
              <li className="bg-blue-500 bg-opacity-30 p-3 rounded-lg border border-blue-400">
                <p className="font-semibold mb-1">Process Bottleneck</p>
                <p className="text-blue-100">Move candidates from "Technical Round" to "Verbal Round" to maintain hiring momentum.</p>
              </li>
              <li className="bg-blue-500 bg-opacity-30 p-3 rounded-lg border border-blue-400">
                <p className="font-semibold mb-1">Top Performer</p>
                <p className="text-blue-100">The current average ATS score is 12% higher than last month's average.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
