import React from 'react';
import { Search, Filter, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { StationFilterParams } from '../../services/stationService';

interface StationFilterBarProps {
  filters: StationFilterParams;
  onFilterChange: (newFilters: Partial<StationFilterParams>) => void;
  currencySymbol: string;
}

export const StationFilterBar: React.FC<StationFilterBarProps> = ({
  filters,
  onFilterChange,
  currencySymbol,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-200 mb-6 space-y-4">
      {/* Top Search & Verified Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by station name, street, neighborhood, or city..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Verified Renewable Toggle */}
        <button
          onClick={() => onFilterChange({ onlyVerifiedRenewable: !filters.onlyVerifiedRenewable })}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
            filters.onlyVerifiedRenewable
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verified 70%+ Renewable Only</span>
        </button>
      </div>

      {/* Filter Chips & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Connector Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold text-[11px] uppercase mr-1">Connector:</span>
          {['ALL', 'CCS2', 'Type 2', 'CHAdeMO', 'Bharat AC001'].map((conn) => (
            <button
              key={conn}
              onClick={() => onFilterChange({ connectorType: conn })}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                (filters.connectorType || 'ALL') === conn
                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {conn === 'ALL' ? 'All Plugs' : conn}
            </button>
          ))}
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold text-[11px] uppercase flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <select
            value={filters.sortBy || 'distance'}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="distance">Nearest Distance</option>
            <option value="renewable">Highest Clean Energy %</option>
            <option value="price">Lowest Price / kWh</option>
            <option value="power">Fastest Power (kW)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
