import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Mail, BarChart3 } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Scale your team with <span className="text-blue-600">AI Precision</span>.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              PreciseHire automates your entire recruitment workflow — from parsing Excel files to AI-powered screening and personalized offer letters. Find the best talent, faster.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => navigate('/app')}
                className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all"
              >
                Get Started
              </button>
              <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Faster Recruitment</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to hire at scale
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900">AI Role Detection</dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p>Llama 3.1 70B automatically categorizes candidates by role based on resume content, even for thousands of entries.</p>
                </dd>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900">Smart ATS Scoring</dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p>Customizable weightage sliders let you rank candidates based on skills, experience, and format with AI precision.</p>
                </dd>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Mail className="h-6 w-6" />
                </div>
                <dt className="text-xl font-bold leading-7 text-gray-900">Automated Emails</dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p>Send personalized interview invites and assessment links automatically written by AI tailored to each candidate.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">Efficiency Boost</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">500x Faster</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">Manual Outreach Effort</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">0 Manual Emails</dd>
            </div>
            <div className="mx-auto flex max-w-xs flex-col gap-y-4">
              <dt className="text-base leading-7 text-gray-600">Analysis Time</dt>
              <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">30s per Batch</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Home;
