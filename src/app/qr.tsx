import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PUNTOS_QR_CAMPUS, useCampusNavigation } from '@/context/NavigationContext';

export default function EscanerQRScreen() {
  const [camaraLista, setCamaraLista] = useState(false);
  const [camKey, setCamKey] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);
  const [mensajeCalibracion, setMensajeCalibracion] = useState<string | null>(null);
  const { origenActual, destinoActivo, recalibrarConQR } = useCampusNavigation();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setEscaneado(false);
      const timer = setTimeout(() => {
        setCamaraLista(true);
      }, 350);

      return () => {
        clearTimeout(timer);
        setCamaraLista(false);
      };
    }, [])
  );

  function procesarCodigo(data: string) {
    if (escaneado) return;
    setEscaneado(true);
    const resultado = recalibrarConQR(data);
    if (resultado.punto) {
      setMensajeCalibracion(
        `Ubicación fijada en: ${resultado.punto.ubicacion} (${resultado.punto.referencia})`
      );
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="qr-code-outline" size={64} color="#38BDF8" />
        <Text style={styles.permTitle}>Acceso a Cámara para QR</Text>
        <Text style={styles.permSub}>
          Habilita la cámara para escanear los puntos de anclaje QR del campus ITSJR.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Permitir cámara</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.badge}>RECALIBRACIÓN INDOOR</Text>
          <TouchableOpacity
            style={styles.reloadCamBtn}
            onPress={() => setCamKey((k) => k + 1)}
          >
            <Ionicons name="refresh" size={14} color="#38BDF8" />
            <Text style={styles.reloadCamText}>Reiniciar lente</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Escáner QR</Text>
        <Text style={styles.sub}>
          Origen actual: <Text style={styles.highlight}>{origenActual.ubicacion}</Text>
        </Text>
      </View>

      {/* Zona centrada con visor cuadrado donde cámara y marco coinciden */}
      <View style={styles.scannerSection}>
        <View style={styles.squareViewport}>
          {camaraLista && (
            <CameraView
              key={camKey}
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={escaneado ? undefined : ({ data }) => procesarCodigo(data)}
            />
          )}

          <View style={styles.overlay} pointerEvents="none">
            <View style={[styles.scanFrame, escaneado && styles.scanFrameSuccess]} />
          </View>
        </View>

        <Text style={styles.scanHint}>
          {escaneado ? 'Código QR detectado' : 'Centra el código QR dentro del recuadro azul'}
        </Text>
      </View>

      {mensajeCalibracion ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{mensajeCalibracion}</Text>
          <Text style={styles.resultRoute}>
            Ruta hacia {destinoActivo.edificio}: {destinoActivo.distanciaMetros} m ({destinoActivo.anguloGrados}°)
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setEscaneado(false);
                setMensajeCalibracion(null);
              }}
            >
              <Text style={styles.secondaryBtnText}>Escanear otro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/cam-ra')}>
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Abrir Cam RA</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.simBox}>
          <Text style={styles.simLabel}>Simular lectura rápida de punto QR:</Text>
          <View style={styles.simRow}>
            {Object.values(PUNTOS_QR_CAMPUS).slice(1, 3).map((punto) => (
              <TouchableOpacity
                key={punto.codigo}
                style={styles.simChip}
                onPress={() => procesarCodigo(punto.codigo)}
              >
                <Text style={styles.simChipText}>{punto.codigo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1324', padding: 20 },
  header: { marginTop: 6, marginBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { color: '#38BDF8', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  reloadCamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#131F38',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  reloadCamText: { color: '#38BDF8', fontSize: 11, fontWeight: '600' },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800', marginTop: 2 },
  sub: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  highlight: { color: '#F8FAFC', fontWeight: '700' },
  scannerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareViewport: {
    width: '92%',
    aspectRatio: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '74%',
    height: '74%',
    borderWidth: 3,
    borderColor: '#38BDF8',
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  scanFrameSuccess: { borderColor: '#22C55E' },
  scanHint: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#131F38',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  resultTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  resultRoute: { color: '#38BDF8', fontSize: 13, marginTop: 4, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
  },
  permButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 22,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryBtnText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  simBox: { marginTop: 8 },
  simLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 6 },
  simRow: { flexDirection: 'row', gap: 8 },
  simChip: {
    flex: 1,
    backgroundColor: '#131F38',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  simChipText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0A1324',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  permTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginTop: 16 },
  permSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
