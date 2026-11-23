import React, { useState } from 'react';
import { ownerService } from '../../services/ownerService';
import { locationService } from '../../services/locationService';
import { showToast } from '../common/Toast';
import {
  X,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  Zap,
  Globe,
  Navigation,
  Search,
  Check,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_FACILITIES = [
  'Restrooms',
  'Free High-Speed WiFi',
  'Solar Canopy',
  'EV Drivers Lounge',
  'Cafe & Dining',
  '24/7 Security & CCTV',
  'Wheelchair Accessible',
  'Battery Swapping Station',
  'Covered Parking',
  'Convenience Store',
];

export const AddStationModal: React.FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [latitude, setLatitude] = useState<string>('12.9716');
  const [longitude, setLongitude] = useState<string>('77.5946');
  const [operatingHours, setOperatingHours] = useState('24/7 Access');
  const [networkOperator, setNetworkOperator] = useState('GreenCharge Verified');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'Restrooms',
    'Free High-Speed WiFi',
    'Solar Canopy',
  ]);

  // Geocoding query
  const [geoQuery, setGeoQuery] = useState('');
  const [geoSearching, setGeoSearching] = useState(false);

  if (!isOpen) return null;

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleUseCurrentLocation = async () => {
    try {
      showToast('info', 'GPS', 'Acquiring coordinates from browser...');
      const loc = await locationService.requestCurrentLocation();
      setLatitude(loc.latitude.toFixed(6));
      setLongitude(loc.longitude.toFixed(6));
      if (loc.city) setCity(loc.city);
      if (loc.addressLabel) setAddress(loc.addressLabel);
      showToast('success', 'Location Set', `Coordinates updated to ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
    } catch (err: any) {
      showToast('warning', 'GPS Notice', err.message || 'Could not fetch current coordinates.');
    }
  };

  const handleGeocodeSearch = async () => {
    if (!geoQuery.trim()) return;
    setGeoSearching(true);
    try {
      const results = await locationService.searchLocations(geoQuery.trim());
      if (results && results.length > 0) {
        const top = results[0];
        setLatitude(top.latitude.toFixed(6));
        setLongitude(top.longitude.toFixed(6));
        setCity(top.city || '');
        setAddress(top.displayName.split(',')[0]);
        if (top.country) setCountry(top.country);
        showToast('success', 'Location Geocoded', `Positioned at ${top.displayName.slice(0, 40)}...`);
      } else {
        showToast('info', 'No Results', 'No matching location found. Please enter manually.');
      }
    } catch (e) {
      showToast('warning', 'Geocoding Error', 'Failed to search address.');
    } finally {
      setGeoSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      setErrorMessage('Please provide valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    if (!name.trim() || !address.trim() || !city.trim()) {
      setErrorMessage('Station name, address, and city are required.');
      return;
    }

    setLoading(true);

    try {
      await ownerService.createStation({
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        latitude: latNum,
        longitude: lonNum,
        operating_hours: operatingHours,
        facilities: selectedFacilities,
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        network_operator: networkOperator.trim(),
        is_public: isPublic,
        photo_url: photoUrl.trim(),
      });

      showToast('success', 'Station Registered', `Successfully created ${name}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create charging station.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Building2 className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Register New Charging Station</h3>
            <p className="text-xs text-slate-500">
              List your EV charging hub on ChargeSmart to connect with EV drivers.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Station Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Station Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GreenCharge EcoHub Phase 2"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Network / Brand Operator</label>
              <input
                type="text"
                value={networkOperator}
                onChange={(e) => setNetworkOperator(e.target.value)}
                placeholder="e.g. ChargeSmart Verified"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description & Driver Amenities</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight solar power backup, lounge facilities, fast chargers, or entrance instructions..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-900"
            />
          </div>

          {/* Quick Location Tools */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Station Geolocation
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300"
              >
                <Navigation className="w-3 h-3" />
                <span>Use Current GPS</span>
              </button>
            </div>

            {/* Address Search Autocomplete */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={geoQuery}
                  onChange={(e) => setGeoQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGeocodeSearch();
                    }
                  }}
                  placeholder="Type address, landmark or city to geocode..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 text-xs text-slate-900"
                />
              </div>
              <button
                type="button"
                onClick={handleGeocodeSearch}
                disabled={geoSearching}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 text-xs shrink-0"
              >
                {geoSearching ? 'Searching...' : 'Locate'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Latitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Longitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Postal Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">
                Street Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 100 Technology Highway"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">State / Province</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Karnataka"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">PIN / Postal Code</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="e.g. 560100"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* Operating Hours & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Operating Hours</label>
              <select
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
              >
                <option value="24/7 Access">24/7 Access (All Day)</option>
                <option value="6:00 AM – 11:00 PM">6:00 AM – 11:00 PM</option>
                <option value="8:00 AM – 10:00 PM">8:00 AM – 10:00 PM</option>
                <option value="9:00 AM – 6:00 PM">9:00 AM – 6:00 PM</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="station@greencharge.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* Facilities Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Available Station Amenities & Clean Energy
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_FACILITIES.map((facility) => {
                const selected = selectedFacilities.includes(facility);
                return (
                  <button
                    type="button"
                    key={facility}
                    onClick={() => toggleFacility(facility)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                      selected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3" />}
                    <span>{facility}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public Listing Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-900">Publish Station Publicly</div>
              <div className="text-[11px] text-slate-500">
                Visible to all EV drivers on the map and discovery engine.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Station Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
