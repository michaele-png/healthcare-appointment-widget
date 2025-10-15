import React from 'react';
import type { Provider } from '../../types';
export const ProviderCard: React.FC<{ provider: Provider; onSelect:(p:Provider)=>void }> = ({ provider, onSelect }) => (
  <div className="card">
    <img src={provider.photo_url || 'https://images.unsplash.com/photo-1550831107-1553da8c8464?w=128&h=128&fit=crop&auto=format'} className="w-16 h-16 rounded-xl object-cover" alt={provider.name} />
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold leading-tight">{provider.name}</div>
          <div className="text-sm text-gray-600">{provider.specialty || 'General'}</div>
        </div>
        {provider.accepting_new_patients && <span className="badge">Accepting</span>}
      </div>
      {provider.bio && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{provider.bio}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button className="btn btn-primary" onClick={()=>onSelect(provider)}>Select</button>
        {provider.next_available && <span className="note">Next: {new Date(provider.next_available).toLocaleString()}</span>}
      </div>
    </div>
  </div>
);
