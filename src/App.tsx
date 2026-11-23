import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { LiveGridTicker } from './components/common/LiveGridTicker';
import { AICopilotDrawer } from './components/ai/AICopilotDrawer';
import { AIEnergyLabView } from './components/ai/AIEnergyLabView';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { StationsPage } from './pages/StationsPage';
import { PlannerForm } from './components/planner/PlannerForm';
import { JourneyPlannerView } from './components/journey/JourneyPlannerView';
import { SavedPlansView } from './components/planner/SavedPlansView';
import { CostCalculatorView } from './components/calculator/CostCalculatorView';
import { EcoCalculatorView } from './components/calculator/EcoCalculatorView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { OwnerDashboardView } from './components/owner/OwnerDashboardView';
import { OwnerAuthModal } from './components/owner/OwnerAuthModal';
import { ownerService } from './services/ownerService';
import { storageService } from './services/storageService';
import { CURRENCY_SYMBOLS } from './data/mockData';
import { ChargingStation, SavedPlan } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currency, setCurrencyState] = useState<'USD' | 'EUR' | 'INR' | 'GBP'>(() => {
    return storageService.getSettings().currency;
  });

  // Owner Auth Modal state
  const [isOwnerAuthOpen, setIsOwnerAuthOpen] = useState(false);

  // State for cross-tab planning transfers
  const [stationForPlan, setStationForPlan] = useState<ChargingStation | null>(null);
  const [planForRecalculate, setPlanForRecalculate] = useState<SavedPlan | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const handleCurrencyChange = (newCurr: 'USD' | 'EUR' | 'INR' | 'GBP') => {
    setCurrencyState(newCurr);
    storageService.saveSettings({ currency: newCurr, currencySymbol: CURRENCY_SYMBOLS[newCurr] });
  };

  const handleNavigateFromAI = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStationForPlan = (station: ChargingStation) => {
    setStationForPlan(station);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecalculateSavedPlan = (plan: SavedPlan) => {
    setPlanForRecalculate(plan);
    setActiveTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenOwnerPortal = () => {
    if (ownerService.isLoggedIn()) {
      setActiveTab('owner-portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsOwnerAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-slate-800">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={handleCurrencyChange}
        onOpenOwnerAuth={handleOpenOwnerPortal}
      />

      {/* Real-Time Live Grid Telemetry Ticker */}
      <LiveGridTicker currencySymbol={currencySymbol} />

      {/* Main Page Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            setActiveTab={setActiveTab}
            currencySymbol={currencySymbol}
            onOpenOwnerPortal={handleOpenOwnerPortal}
          />
        )}

        {activeTab === 'stations' && (
          <StationsPage
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
            onSelectStationForPlan={handleSelectStationForPlan}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerForm
            currency={currency}
            currencySymbol={currencySymbol}
            initialStation={stationForPlan}
            initialPlan={planForRecalculate}
          />
        )}

        {activeTab === 'journey' && (
          <JourneyPlannerView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'cost-calc' && (
          <CostCalculatorView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'eco-calc' && <EcoCalculatorView />}

        {activeTab === 'analytics' && (
          <AnalyticsView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'saved-plans' && (
          <SavedPlansView
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
            onRecalculatePlan={handleRecalculateSavedPlan}
          />
        )}

        {activeTab === 'owner-portal' && (
          <OwnerDashboardView
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
            onSelectStationForPlan={handleSelectStationForPlan}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'ai-lab' && (
          <AIEnergyLabView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'settings' && (
          <SettingsView onCurrencyChange={handleCurrencyChange} />
        )}
      </main>

      {/* Station Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={isOwnerAuthOpen}
        onClose={() => setIsOwnerAuthOpen(false)}
        onSuccess={() => {
          setActiveTab('owner-portal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Interactive AI Energy Copilot Floating Drawer */}
      <AICopilotDrawer
        onNavigateTab={handleNavigateFromAI}
        currencySymbol={currencySymbol}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
