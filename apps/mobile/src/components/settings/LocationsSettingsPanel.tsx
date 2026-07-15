import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MapPin, Plus, Trash2 } from 'lucide-react-native';
import type { Location } from '@costify/shared/domain/location';
import { countActiveLocations } from '@costify/shared/domain/location';
import {
  SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD,
  SUBSCRIPTION_INCLUDED_LOCATIONS,
} from '@costify/shared/domain/subscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

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
  const { colors } = useTheme();
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
    showToast('Local guardado.');
  }

  return (
    <Card>
      <View style={styles.header}>
        <MapPin size={18} color={colors.brand} />
        <Text style={[styles.title, { color: colors.foreground }]}>Locales</Text>
      </View>
      <Text style={[styles.hint, { color: colors.muted }]}>
        {activeCount} activo{activeCount === 1 ? '' : 's'} · {SUBSCRIPTION_INCLUDED_LOCATIONS} incluido
        {additional > 0
          ? ` · +$${SUBSCRIPTION_ADDITIONAL_LOCATION_PRICE_USD}/mes × ${additional}`
          : ''}
      </Text>

      {locations.map((location) => (
        <View
          key={location.id}
          style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{location.name}</Text>
            <Text style={[styles.rowMeta, { color: colors.muted }]}>
              {location.code ? `Código: ${location.code}` : 'Sin código'} ·{' '}
              {location.active ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
          <Pressable
            onPress={() =>
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
            style={[styles.smallBtn, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
              {location.active ? 'Desactivar' : 'Activar'}
            </Text>
          </Pressable>
          {locations.length > 1 ? (
            <Pressable onPress={() => onDelete(location.id)} style={styles.iconBtn}>
              <Trash2 size={16} color={colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ))}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del local"
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
      />
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Código CSV (opcional)"
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
      />
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Dirección (opcional)"
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
      />
      <Button onPress={handleAdd}>
        <Plus size={16} color="#fff" />
        <Text style={styles.btnText}> Agregar local</Text>
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowTitle: { fontWeight: '600' },
  rowMeta: { fontSize: 12, marginTop: 2 },
  smallBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { padding: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
