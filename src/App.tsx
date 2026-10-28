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
import { CostCalculatorView } from './components/calculator/CostCalculatorView';
import { EcoCalculatorView } from './components/calculator/EcoCalculatorView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { storageService } from './services/storageService';
import { CURRENCY_SYMBOLS } from './data/mockData';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currency, setCurrencyState] = useState<'USD' | 'EUR' | 'INR' | 'GBP'>(() => {
    return storageService.getSettings().currency;
  });

  const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

  const handleCurrencyChange = (newCurr: 'USD' | 'EUR' | 'INR' | 'GBP') => {
    setCurrencyState(newCurr);
    storageService.saveSettings({ currency: newCurr, currencySymbol: CURRENCY_SYMBOLS[newCurr] });
  };

  const handleNavigateFromAI = (tab: string, priority?: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] text-slate-800">
      {/* Sticky Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={handleCurrencyChange}
      />

      {/* Real-Time Live Grid Telemetry Ticker */}
      <LiveGridTicker currencySymbol={currencySymbol} />

      {/* Main Page Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage setActiveTab={setActiveTab} currencySymbol={currencySymbol} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerForm currency={currency} currencySymbol={currencySymbol} />
        )}

        {activeTab === 'ai-lab' && (
          <AIEnergyLabView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'stations' && (
          <StationsPage
            currencySymbol={currencySymbol}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'cost-calc' && (
          <CostCalculatorView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'eco-calc' && <EcoCalculatorView />}

        {activeTab === 'analytics' && (
          <AnalyticsView currencySymbol={currencySymbol} />
        )}

        {activeTab === 'settings' && (
          <SettingsView onCurrencyChange={handleCurrencyChange} />
        )}
      </main>

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
