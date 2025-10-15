import React, { useEffect, useState } from 'react';
import { useWidget } from '../context/WidgetContext';
import { api } from '../api/client';
import { Provider } from '../types';
import { ProviderCard } from '../components/cards/ProviderCard';

export default function ProviderSelectionStep(){
  const { setCurrentStep, updateBookingData, practiceId } = useWidget();
  const [items, setItems] = useState<Provider[]>([]);
  useEffect(()=>{ api.providers({ practice_id: practiceId }).then(r=>setItems(r.providers||[])).catch(()=>setItems([])); },[practiceId]);
  return (<div>
    <h3 className="text-lg font-semibold mb-3">Choose a provider</h3>
    <div className="grid gap-3">{items.map(p=>(<ProviderCard key={p.id} provider={p} onSelect={(prov)=>{ updateBookingData({ provider: prov }); setCurrentStep('appointment-type'); }} />))}</div>
  </div>);
}
