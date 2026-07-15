'use client';

import { useState } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import type { Location } from '@costify/shared/domain/location';
import { countActiveLocations } from '@costify/shared/domain/location';
import {
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_INCLUDED_LOCATIONS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';

interface LocationsSettingsPanelProps {
  locations: Location[];
  onSave: (
    input: { name: string; code?: string; active?: boolean; address?: string },
    id?: string,
    timestamp?: number
  ) => Location;
  onDelete: (id: string) => void;
}

export function LocationsSettingsPanel({
  locations,
  onSave,
  onDelete,
}: LocationsSettingsPanelProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const activeCount = countActiveLocations(locations);
  const additional = Math.max(0, activeCount - SUBSCRIPTION_INCLUDED_LOCATIONS);

  function handleAdd() {
    if (!name.trim()) {
      showToast('Indica el nombre del local.', 'error');
      return;
    }
    onSave({ name: name.trim(), code: code.trim() || undefined, address: address.trim() || undefined, active: true });
    setName('');
    setCode('');
    setAddress('');
    showToast('Local guardado. Sincroniza para actualizar la suscripción si agregaste locales activos.');
  }

  return (
    <Card>
      <SectionHeader
        icon={MapPin}
        title="Locales"
        description="Administra sucursales bajo tu cuenta. Cada local activo adicional suma al plan de suscripción."
      />

      <p className="text-sm text-muted-foreground mb-4">
        {activeCount} local{activeCount === 1 ? '' : 'es'} activo{activeCount === 1 ? '' : 's'} ·{' '}
        {SUBSCRIPTION_INCLUDED_LOCATIONS} incluido en precio base
        {additional > 0
          ? ` · +$${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes por ${additional} adicional${additional === 1 ? '' : 'es'}`
          : ''}
      </p>

      <div className="space-y-3 mb-6">
        {locations.map((location) => (
          <div
            key={location.id}
            className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{location.name}</p>
              <p className="text-xs text-muted-foreground">
                {location.code ? `Código: ${location.code}` : 'Sin código CSV'} ·{' '}
                {location.active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onSave(
                    {
                      name: location.name,
                      code: location.code,
                      active: !location.active,
                      address: location.address,
                    },
                    location.id,
                    location.timestamp
                  )
                }
              >
                {location.active ? 'Desactivar' : 'Activar'}
              </Button>
              {locations.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(location.id)}
                  aria-label="Eliminar local"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Nombre del local" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Código CSV (opcional)" value={code} onChange={(e) => setCode(e.target.value)} />
        <Input label="Dirección (opcional)" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <Button type="button" className="mt-4" onClick={handleAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Agregar local
      </Button>
    </Card>
  );
}
