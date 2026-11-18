import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DestinoCalculado, useCampusNavigation } from '@/context/NavigationContext';

export default function InicioScreen() {
  const [busqueda, setBusqueda] = useState('');
  const {
    origenActual,
    destinoActivo,
    destinosConDistancia,
    esFavorito,
    toggleFavorito,
    setDestinoPorId,
  } = useCampusNavigation();
  const router = useRouter();

  const resultados = destinosConDistancia.filter(
    (d) =>
      d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.edificio.toLowerCase().includes(busqueda.toLowerCase())
  );

  function seleccionarYGuiar(destino: DestinoCalculado) {
    setDestinoPorId(destino.id);
    router.push('/cam-ra');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.badge}>TECNM • SAN JUAN DEL RÍO</Text>
          <Text style={styles.title}>TecNMGuía SJR</Text>
        </View>

        <TouchableOpacity style={styles.originBanner} onPress={() => router.push('/qr')}>
          <Ionicons name="location" size={20} color="#38BDF8" />
          <View style={styles.originInfo}>
            <Text style={styles.originLabel}>UBICACIÓN ACTUAL</Text>
            <Text style={styles.originText}>{origenActual.ubicacion}</Text>
          </View>
          <View style={styles.qrChip}>
            <Ionicons name="qr-code-outline" size={14} color="#F8FAFC" />
            <Text style={styles.qrChipText}>Recalibrar</Text>
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar aula, laboratorio o edificio (ej. Edificio K)..."
          placeholderTextColor="#64748B"
          value={busqueda}
          onChangeText={setBusqueda}
        />

        <Text style={styles.sectionTitle}>Destinos del Campus</Text>
        {resultados.map((item) => {
          const esActivo = item.id === destinoActivo.id;
          const guardado = esFavorito(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, esActivo && styles.cardActive]}
              onPress={() => seleccionarYGuiar(item)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <View style={styles.cardActions}>
                  <Text style={styles.cardTag}>{item.edificio}</Text>
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorito(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={guardado ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={guardado ? '#FACC15' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardSub}>
                  {item.piso} • {item.distanciaMetros} m ({item.anguloGrados}°)
                </Text>
                <View style={styles.arAction}>
                  <Ionicons name="navigate" size={14} color="#38BDF8" />
                  <Text style={styles.arActionText}>Iniciar RA</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1324' },
  scroll: { padding: 20 },
  header: { marginBottom: 14, marginTop: 8 },
  badge: { color: '#38BDF8', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 4 },
  originBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131F38',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 10,
  },
  originInfo: { flex: 1 },
  originLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  originText: { color: '#F8FAFC', fontSize: 14, fontWeight: '600', marginTop: 2 },
  qrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  qrChipText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  searchInput: {
    backgroundColor: '#131F38',
    color: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20,
  },
  sectionTitle: { color: '#E2E8F0', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: '#131F38',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardActive: { borderColor: '#38BDF8' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTag: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  favBtn: { padding: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  cardSub: { color: '#94A3B8', fontSize: 13 },
  arAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arActionText: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },
});
