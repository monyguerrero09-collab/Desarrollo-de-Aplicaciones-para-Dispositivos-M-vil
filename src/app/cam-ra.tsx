import Ionicons from '@expo/vector-icons/Ionicons';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import { useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CampusARScene from '@/components/CampusARScene';
import { useCampusNavigation } from '@/context/NavigationContext';

export default function CamRAScreen() {
  const [isFocused, setIsFocused] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const { destinoActivo } = useCampusNavigation();
  const [estadoTracking, setEstadoTracking] = useState('Iniciando sensor ARCore...');
  const [arKey, setArKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#38BDF8" />
        <Text style={styles.permTitle}>Permiso de Cámara Necesario</Text>
        <Text style={styles.permSub}>
          TecNMGuía SJR necesita acceso a la cámara para proyectar las flechas de navegación en Realidad Aumentada.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Conceder permiso de cámara</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <ViroARSceneNavigator
          key={`${destinoActivo.id}-${arKey}`}
          autofocus={true}
          initialScene={{ scene: CampusARScene }}
          viroAppProps={{
            destino: destinoActivo,
            onTrackingChange: setEstadoTracking,
          }}
          style={styles.arView}
        />
      )}

      <SafeAreaView style={styles.hudTop} pointerEvents="box-none">
        <View style={styles.hudCard}>
          <View style={styles.hudRow}>
            <Text style={styles.hudBadge}>{destinoActivo.edificio}</Text>
            <Text style={styles.hudDist}>{destinoActivo.distanciaMetros} m</Text>
          </View>
          <Text style={styles.hudTitle}>{destinoActivo.nombre}</Text>
          <Text style={styles.hudStatus}>{estadoTracking}</Text>
        </View>
      </SafeAreaView>

      <View style={styles.hudBottom} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={() => setArKey((prev) => prev + 1)}
        >
          <Ionicons name="compass-outline" size={20} color="#F8FAFC" />
          <Text style={styles.recenterText}>Recentrar flecha 3D</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1324' },
  arView: { flex: 1 },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0A1324',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  permTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  permSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  permButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 22,
  },
  permButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  hudTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hudCard: {
    backgroundColor: 'rgba(10, 19, 36, 0.86)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudBadge: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hudDist: { color: '#38BDF8', fontSize: 15, fontWeight: '800' },
  hudTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginTop: 6 },
  hudStatus: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  hudBottom: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  recenterText: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
});
