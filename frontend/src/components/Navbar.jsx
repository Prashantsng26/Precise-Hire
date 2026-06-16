import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, LayoutDashboard, Settings, Activity, UserCheck, GitBranch } from 'lucide-react';
import { NavBar } from './ui/tubelight-navbar';

const Navbar = () => {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { name: 'Admin App', url: '/app', icon: Settings },
    { name: 'Screening', url: '/screening', icon: Activity },
    { name: 'Shortlist', url: '/shortlist', icon: UserCheck },
    { name: 'Pipeline', url: '/pipeline', icon: GitBranch }
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center cursor-pointer select-none">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg mr-2.5">P</div>
            <span className="text-xl font-black text-text-primary tracking-tight">Precise</span>
            <span className="text-xl font-black text-primary tracking-tight ml-0.5">Hire</span>
          </Link>
          
          <div className="hidden sm:flex items-center justify-center flex-1 mx-4">
            <NavBar items={navItems} />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="sm:hidden">
              <NavBar items={navItems} />
            </div>
            <Link 
              to="/app" 
              className="bg-[#151e2e] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-[#151e2e]/90 transition-all shadow-sm whitespace-nowrap"
            >
              Admin Console
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
