import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg mr-2.5">P</div>
              <span className="text-xl font-bold text-text-primary tracking-tight">Precise</span>
              <span className="text-xl font-bold text-primary tracking-tight ml-0.5">Hire</span>
            </div>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {[
                { name: 'Home', path: '/' },
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Screening', path: '/screening' },
                { name: 'Shortlist', path: '/shortlist' },
                { name: 'Pipeline', path: '/pipeline' }
              ].map((item) => (
                <NavLink 
                  key={item.path}
                  to={item.path} 
                  className={({ isActive }) => `inline-flex items-center px-1 pt-1 text-sm font-semibold transition-all relative ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  {({ isActive }) => (
                    <>
                      {item.name}
                      {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></div>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <NavLink 
              to="/app" 
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              Admin Console
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
