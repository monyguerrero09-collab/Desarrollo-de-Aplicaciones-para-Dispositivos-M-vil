import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DestinoCalculado, useCampusNavigation } from '@/context/NavigationContext';

export default function FavoritosScreen() {
  const { favoritosDestinos, toggleFavorito, setDestinoPorId } = useCampusNavigation();
  const router = useRouter();

  function iniciarRutaRA(destino: DestinoCalculado) {
    setDestinoPorId(destino.id);
    router.push('/cam-ra');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>ACCESO RÁPIDO</Text>
        <Text style={styles.title}>Favoritos</Text>
        <Text style={styles.subtitle}>
          {favoritosDestinos.length}{' '}
          {favoritosDestinos.length === 1 ? 'destino guardado' : 'destinos guardados'}
        </Text>
      </View>

      {favoritosDestinos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bookmark-outline" size={52} color="#38BDF8" />
          <Text style={styles.emptyTitle}>Sin aulas guardadas aún</Text>
          <Text style={styles.emptySub}>
            Toca el ícono de marcador junto a cualquier edificio en Inicio para guardarlo aquí.
          </Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/')}>
            <Text style={styles.exploreBtnText}>Explorar destinos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {favoritosDestinos.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTag}>{item.edificio}</Text>
                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                  <Text style={styles.cardMeta}>
                    {item.piso} • {item.distanciaMetros} m ({item.anguloGrados}°)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => toggleFavorito(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#F87171" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.goArBtn} onPress={() => iniciarRutaRA(item)}>
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.goArText}>Guiar con Cam RA</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1324', padding: 20 },
  header: { marginTop: 8, marginBottom: 18 },
  badge: { color: '#38BDF8', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  emptyBox: {
    flex: 1,
    backgroundColor: '#131F38',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  exploreBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  exploreBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#131F38',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 10 },
  cardTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  cardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  cardMeta: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  removeBtn: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 8,
  },
  goArBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 14,
  },
  goArText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
