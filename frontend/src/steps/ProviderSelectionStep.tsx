import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api, Location, Provider } from '../api/api';
import { ProviderCard } from '../components/cards/ProviderCard';

export default function ProviderSelectionStep() {
  const { setCurrentStep, updateBookingData } = useWidget();

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load available locations from backend
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.locations()
      .then((locs) => {
        if (!mounted) return;
        setLocations(locs);
        // If you only have 1 location, auto-select it
        if (locs.length === 1) setLocationId(String(locs[0].id));
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Load providers for selected location
  useEffect(() => {
    if (!locationId) return;
    let mounted = true;
    setLoading(true);
    api.providers(locationId)
      .then((rows) => { if (mounted) setProviders(rows); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [locationId]);

  const onSelectProvider = (prov: Provider) => {
    // Persist both the chosen location and provider in bookingData
    updateBookingData({
      locationId,
      provider: {
        id: prov.id,
        name: prov.name,
        // include location_id for convenience if your downstream uses it
        location_id: locationId,
      },
    });
    setCurrentStep('appointment-type');
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Choose a provider</h3>

      {err && <div className="error">{err}</div>}
      {loading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}

      {/* Location selector (hidden if there’s only one) */}
      {locations.length > 1 && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            className="input"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">Select a location</option>
            {locations.map((l) => (
              <option key={String(l.id)} value={String(l.id)}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Providers grid */}
      <div className="grid gap-3">
        {providers.map((p) => (
          <ProviderCard
            key={String(p.id)}
            provider={{ id: String(p.id), name: p.name }}
            onSelect={onSelectProvider}
          />
        ))}
        {!loading && providers.length === 0 && locationId && (
          <div className="text-sm text-gray-600">No providers found for this location.</div>
        )}
      </div>
    </div>
  );
}
