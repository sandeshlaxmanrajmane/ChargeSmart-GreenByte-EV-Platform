import { SavedPlan, UserSettings } from '../types';
import { DEFAULT_SETTINGS, INITIAL_SAVED_PLANS } from '../data/mockData';

const STORAGE_KEYS = {
  SAVED_PLANS: 'chargesmart_saved_plans_v1',
  SETTINGS: 'chargesmart_settings_v1',
};

// Storage Service with reactive event emission
class StorageService {
  private notifyListeners() {
    window.dispatchEvent(new Event('chargesmart_data_updated'));
  }

  // --- Saved Plans ---
  getSavedPlans(): SavedPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
      if (!data) {
        // Seed initial plans
        this.setSavedPlans(INITIAL_SAVED_PLANS);
        return INITIAL_SAVED_PLANS;
      }
      return JSON.parse(data) as SavedPlan[];
    } catch {
      return INITIAL_SAVED_PLANS;
    }
  }

  setSavedPlans(plans: SavedPlan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(plans));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save plans to localStorage', e);
    }
  }

  savePlan(newPlan: Omit<SavedPlan, 'id' | 'createdAt'>): SavedPlan {
    const plans = this.getSavedPlans();
    const createdPlan: SavedPlan = {
      ...newPlan,
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [createdPlan, ...plans];
    this.setSavedPlans(updated);
    return createdPlan;
  }

  deletePlan(planId: string): boolean {
    const plans = this.getSavedPlans();
    const filtered = plans.filter((p) => p.id !== planId);
    if (filtered.length !== plans.length) {
      this.setSavedPlans(filtered);
      return true;
    }
    return false;
  }

  // --- Settings ---
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<UserSettings>): UserSettings {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      this.notifyListeners();
      return updated;
    } catch (e) {
      console.error('Failed to save settings', e);
      return DEFAULT_SETTINGS;
    }
  }

  // Reset to default demo data
  resetDemoData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(INITIAL_SAVED_PLANS));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to reset demo data', e);
    }
  }

  exportPlanAsJson(plan: SavedPlan): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ChargeSmart_Plan_${plan.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

export const storageService = new StorageService();
