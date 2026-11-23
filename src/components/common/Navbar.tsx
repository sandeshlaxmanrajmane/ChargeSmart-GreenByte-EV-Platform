import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { ownerService } from '../../services/ownerService';
import { locationService } from '../../services/locationService';
import { StationOwner } from '../../types';
import { showToast } from './Toast';
import {
  Sparkles,
  CalendarClock,
  MapPin,
  Route,
  Calculator,
  Leaf,
  BarChart3,
  BookmarkCheck,
  LayoutDashboard,
  Cpu,
  Settings,
  Menu,
  X,
  Building2,
  Navigation,
  LogOut,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: string;
  setCurrency: (currency: 'USD' | 'EUR' | 'INR' | 'GBP') => void;
  onOpenOwnerAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onOpenOwnerAuth,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [owner, setOwner] = useState<StationOwner | null>(() => ownerService.getOwner());
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = ownerService.subscribe(() => {
      setOwner(ownerService.getOwner());
    });
    return () => unsub();
  }, []);

  // Public Core Navigation Items (Section 4 Requirement)
  const publicNavLinks = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'stations', label: 'Find Stations', icon: MapPin },
    { id: 'planner', label: 'Smart Charging', icon: CalendarClock, highlight: true },
    { id: 'journey', label: 'Journey Planner', icon: Route },
    { id: 'cost-calc', label: 'Cost Calculator', icon: Calculator },
    { id: 'eco-calc', label: 'Environmental Impact', icon: Leaf },
    { id: 'saved-plans', label: 'Saved Plans', icon: BookmarkCheck },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setOwnerMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseMyLocation = async () => {
    try {
      showToast('info', 'GPS', 'Requesting satellite coordinates from your device...');
      await locationService.requestCurrentLocation();
      setActiveTab('stations');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('success', 'Location Acquired', 'Centered station radar on your current location.');
    } catch (err: any) {
      setActiveTab('stations');
      showToast('warning', 'Location Notice', err.message || 'Please search manually or grant GPS permission.');
    }
  };

  const handleLogout = async () => {
    await ownerService.logout();
    setOwnerMenuOpen(false);
    showToast('info', 'Signed Out', 'You have been logged out of the Station Owner Portal.');
    setActiveTab('home');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-sm transition-all">
      {/* Top micro-bar */}
      <div className="bg-gradient-to-r from-forest via-emerald-900 to-slate-900 text-white px-4 py-1 text-[11px] font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-300 font-bold">ChargeSmart</span>
          <span className="text-slate-400">• Smart EV & Renewable Energy Optimization</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <span className="hidden md:inline text-[10px] text-emerald-400 font-medium">
            Verified Station Operator Network & OSM Integrated
          </span>
          <span className="text-emerald-400 font-bold font-mono text-[10px]">v2.5 Live</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 shrink-0"
        >
          <BrandLogo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-0.5">
          {publicNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-300'
                    : link.highlight
                    ? 'text-emerald-700 hover:bg-emerald-50/70 hover:text-emerald-900 font-bold'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-emerald-600' : link.highlight ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Medium Screen Navigation (Compact) */}
        <nav className="hidden lg:flex xl:hidden items-center gap-1">
          {publicNavLinks.slice(0, 4).map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold ${
                  isActive ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side Controls */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Use My Location Quick Trigger */}
          <button
            onClick={handleUseMyLocation}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
            title="Locate stations near me using device GPS"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden 2xl:inline">Use My Location</span>
          </button>

          {/* Station Owner Login OR Owner Portal Pill */}
          {owner ? (
            <div className="relative">
              <button
                onClick={() => handleNavClick('owner-portal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === 'owner-portal'
                    ? 'bg-forest text-white border-forest shadow-md'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="max-w-[130px] truncate">{owner.business_name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenOwnerAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-emerald-900 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Owner Portal</span>
            </button>
          )}

          {/* Get Started / Plan Charging Action Button */}
          <button
            onClick={() => handleNavClick('planner')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Plan Charging</span>
          </button>

          {/* Currency Pill Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-mono font-bold">
            {(['USD', 'EUR', 'INR', 'GBP'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-1.5 py-0.5 rounded-md text-[11px] transition-all ${
                  currency === curr
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'INR' ? '₹' : '£'}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {owner ? (
            <button
              onClick={() => handleNavClick('owner-portal')}
              className="px-2 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-300 flex items-center gap-1"
            >
              <Building2 className="w-3 h-3 text-emerald-700" />
              <span>Portal</span>
            </button>
          ) : (
            <button
              onClick={onOpenOwnerAuth}
              className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200"
            >
              Owner Login
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white/98 px-4 pt-3 pb-6 space-y-1 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto">
          {/* Use My Location Mobile Button */}
          <div className="pb-2">
            <button
              onClick={() => {
                handleUseMyLocation();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold"
            >
              <Navigation className="w-4 h-4 text-emerald-600" />
              <span>Find Stations Near My Current Location</span>
            </button>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">
            EV Driver Platform
          </div>
          {publicNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.highlight && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Planner
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">
            Station Operator System
          </div>
          {owner ? (
            <>
              <button
                onClick={() => handleNavClick('owner-portal')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold ${
                  activeTab === 'owner-portal'
                    ? 'bg-forest text-white'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>{owner.business_name} (Dashboard)</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Portal</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOwnerAuth();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200"
            >
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Station Owner Login / Register</span>
            </button>
          )}

          {/* Currency selection mobile */}
          <div className="pt-3 px-3 flex items-center justify-between text-xs text-slate-600">
            <span>Currency:</span>
            <div className="flex gap-1">
              {(['USD', 'EUR', 'INR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                    currency === curr ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
