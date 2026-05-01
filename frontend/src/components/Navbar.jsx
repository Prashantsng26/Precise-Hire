import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl mr-2">P</div>
              <span className="text-xl font-bold text-gray-900">Precise</span>
              <span className="text-xl font-bold text-blue-600">Hire</span>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <NavLink to="/" className={({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                Home
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                Dashboard
              </NavLink>
              <NavLink to="/app" className={({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                Admin App
              </NavLink>
              <NavLink to="/screening" className={({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                Screening
              </NavLink>
              <NavLink to="/shortlist" className={({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                Shortlist
              </NavLink>
              <NavLink to="/pipeline" className={({ isActive }) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                Pipeline
              </NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <button className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
              Admin Console
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
