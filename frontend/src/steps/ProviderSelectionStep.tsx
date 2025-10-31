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

  // Load locations
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.locations()
      .then((locs) => {
        if (!mounted) return;
        setLocations(locs);
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
    updateBookingData({
      locationId,
      provider: { id: prov.id, name: prov.name, location_id: locationId },
    });
    setCurrentStep('appointment-type');
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Choose a provider</h3>
      {err && <div className="error">{err}</div>}
      {locations.length > 1 && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Location</label>
          <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">Select a location</option>
            {locations.map((l) => <option key={String(l.id)} value={String(l.id)}>{l.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-3">
        {providers.map((p) => (
          <ProviderCard
            key={String(p.id)}
            provider={{ id: String(p.id), name: p.name }}
            onSelect={onSelectProvider}
          />
        ))}
        {!loading && locationId && providers.length === 0 && (
          <div className="text-sm text-gray-600">No providers found for this location.</div>
        )}
      </div>
    </div>
  );
}
