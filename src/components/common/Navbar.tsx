import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  CalendarClock,
  MapPin,
  Calculator,
  Leaf,
  BarChart3,
  Settings,
  Menu,
  X,
  Sparkles,
  Cpu,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: string;
  setCurrency: (currency: 'USD' | 'EUR' | 'INR' | 'GBP') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Overview', icon: Sparkles },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Smart Planner', icon: CalendarClock, highlight: true },
    { id: 'ai-lab', label: 'AI/ML Lab', icon: Cpu, isAI: true },
    { id: 'stations', label: 'Station Finder', icon: MapPin },
    { id: 'cost-calc', label: 'Cost Calc', icon: Calculator },
    { id: 'eco-calc', label: 'Eco Impact', icon: Leaf },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-emerald-950/10 shadow-sm transition-all">
      {/* Top micro-bar for DSU Ideathon 2026 */}
      <div className="bg-gradient-to-r from-forest via-emerald-900 to-forest-dark text-white px-4 py-1 text-[11px] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-300 font-semibold">DSU Ideathon 2026</span>
          <span className="hidden sm:inline text-slate-300">• Clean Mobility & EV Infrastructure Domain</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="hidden md:inline">Simulation Mode: Active Renewable Grid</span>
          <span className="text-emerald-400 font-bold">GreenByte System v2.4</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs border border-emerald-200'
                    : link.highlight
                    ? 'text-emerald-700 hover:bg-emerald-50/70 hover:text-emerald-900 font-semibold'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-emerald-600' : link.highlight ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>{link.label}</span>
                {link.isAI && (
                  <span className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ml-0.5 shadow-2xs">
                    AI
                  </span>
                )}
                {link.highlight && !isActive && (
                  <span className="relative flex h-1.5 w-1.5 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action & Currency Switcher */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Quick Currency Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
            {(['USD', 'EUR', 'INR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-2 py-1 rounded-md transition-all ${
                  currency === curr
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'INR' ? '₹' : '£'} {curr}
              </button>
            ))}
          </div>

          {/* Quick Plan My Charge CTA button */}
          <button
            onClick={() => handleNavClick('planner')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-emerald-600/20 hover:scale-[1.02]"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Plan My Charge</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-bold text-slate-600">
            <span className="px-1.5">{currency}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 shadow-xl animate-fade-in">
          <div className="grid grid-cols-2 gap-2 mb-3 pt-1">
            <div className="text-xs text-slate-500 font-medium px-2 py-1">Currency:</div>
            <div className="flex justify-end gap-1">
              {(['USD', 'EUR', 'INR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    currency === curr ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  <span>{link.label}</span>
                </div>
                {link.highlight && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
