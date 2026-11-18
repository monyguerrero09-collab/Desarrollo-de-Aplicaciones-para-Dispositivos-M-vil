import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DestinoCalculado, useCampusNavigation } from '@/context/NavigationContext';

const CAMPUS_CENTER = {
  lat: 20.374312,
  lng: -99.984141,
};

function latLngToTileFloat(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function tileFloatToLatLng(tileX: number, tileY: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (tileX / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

// Cuadricula 5x5 para cubrir toda la pantalla al arrastrar y hacer pinch-to-zoom
const TILE_OFFSETS: { dx: number; dy: number }[] = [];
for (let dy = -2; dy <= 2; dy++) {
  for (let dx = -2; dx <= 2; dx++) {
    TILE_OFFSETS.push({ dx, dy });
  }
}

export default function Mapa2DScreen() {
  const {
    origenActual,
    destinoActivo,
    destinosConDistancia,
    gpsActivo,
    dentroDelCampus,
    precisionGpsMetros,
    activarGPS,
    esFavorito,
    toggleFavorito,
    setDestinoPorId,
  } = useCampusNavigation();
  const router = useRouter();

  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [zoomFloat, setZoomFloat] = useState(18);
  const [tipoMapa, setTipoMapa] = useState<'y' | 'm'>('y');
  const [cameraCenter, setCameraCenter] = useState(CAMPUS_CENTER);
  const [panelExpandido, setPanelExpandido] = useState(true);

  const zoomInt = Math.max(16, Math.min(19, Math.round(zoomFloat)));
  const scaleFactor = Math.pow(2, zoomFloat - zoomInt);
  const TILE_PX = 256 * scaleFactor;

  // Referencias mutables para gestos fluidos (1 dedo pan + 2 dedos pinch)
  const gestureRef = useRef({
    startCenter: cameraCenter,
    startZoom: zoomFloat,
    initialPinchDist: 0,
    isPinching: false,
  });

  gestureRef.current.startCenter = cameraCenter;
  gestureRef.current.startZoom = zoomFloat;

  const panStartRef = useRef({
    center: CAMPUS_CENTER,
    zoom: 18,
    pinchDist: 0,
    pinching: false,
  });

  function getTouchDistance(touches: readonly any[]) {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.hypot(dx, dy);
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const touches = evt.nativeEvent.touches;
          panStartRef.current.center = gestureRef.current.startCenter;
          panStartRef.current.zoom = gestureRef.current.startZoom;
          if (touches.length >= 2) {
            panStartRef.current.pinching = true;
            panStartRef.current.pinchDist = getTouchDistance(touches);
          } else {
            panStartRef.current.pinching = false;
            panStartRef.current.pinchDist = 0;
          }
        },
        onPanResponderMove: (evt: GestureResponderEvent, gestureState) => {
          const touches = evt.nativeEvent.touches;

          // Gesto de 2 dedos: Pinch-to-Zoom
          if (touches.length >= 2) {
            const currentDist = getTouchDistance(touches);
            if (!panStartRef.current.pinching || panStartRef.current.pinchDist === 0) {
              panStartRef.current.pinching = true;
              panStartRef.current.pinchDist = currentDist;
              panStartRef.current.zoom = gestureRef.current.startZoom;
              return;
            }
            const ratio = currentDist / panStartRef.current.pinchDist;
            const deltaZoom = Math.log2(ratio);
            const nextZoom = Math.max(15.5, Math.min(19.8, panStartRef.current.zoom + deltaZoom));
            setZoomFloat(nextZoom);
            return;
          }

          // Si venia de pellizcar y solto un dedo, reinicia ancla de arrastre
          if (panStartRef.current.pinching) {
            panStartRef.current.pinching = false;
            panStartRef.current.center = gestureRef.current.startCenter;
            return;
          }

          // Gesto de 1 dedo: Arrastrar mapa libremente
          const currentZoom = gestureRef.current.startZoom;
          const zInt = Math.max(16, Math.min(19, Math.round(currentZoom)));
          const pxPerTile = 256 * Math.pow(2, currentZoom - zInt);

          const startTile = latLngToTileFloat(
            panStartRef.current.center.lat,
            panStartRef.current.center.lng,
            zInt
          );
          const nextTileX = startTile.x - gestureState.dx / pxPerTile;
          const nextTileY = startTile.y - gestureState.dy / pxPerTile;
          const nextCoords = tileFloatToLatLng(nextTileX, nextTileY, zInt);
          setCameraCenter(nextCoords);
        },
        onPanResponderRelease: () => {
          panStartRef.current.pinching = false;
          panStartRef.current.pinchDist = 0;
        },
      }),
    []
  );

  const centerFloat = latLngToTileFloat(cameraCenter.lat, cameraCenter.lng, zoomInt);
  const centerTileX = Math.floor(centerFloat.x);
  const centerTileY = Math.floor(centerFloat.y);

  function onMapLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ width, height });
  }

  const centerPixelX = mapSize.width / 2;
  const centerPixelY = mapSize.height / 2;

  function geoToPixel(lat: number, lng: number) {
    const pt = latLngToTileFloat(lat, lng, zoomInt);
    return {
      left: centerPixelX + (pt.x - centerFloat.x) * TILE_PX,
      top: centerPixelY + (pt.y - centerFloat.y) * TILE_PX,
    };
  }

  const posOrigen = geoToPixel(origenActual.lat, origenActual.lng);
  const posDestino = geoToPixel(destinoActivo.lat, destinoActivo.lng);

  const dxPx = posDestino.left - posOrigen.left;
  const dyPx = posDestino.top - posOrigen.top;
  const lineLength = Math.hypot(dxPx, dyPx);
  const lineAngleDeg = (Math.atan2(dyPx, dxPx) * 180) / Math.PI;
  const midX = (posOrigen.left + posDestino.left) / 2;
  const midY = (posOrigen.top + posDestino.top) / 2;

  function seleccionarEdificio(destino: DestinoCalculado) {
    setDestinoPorId(destino.id);
    setCameraCenter({ lat: destino.lat, lng: destino.lng });
  }

  function centrarCampus() {
    activarGPS();
    setCameraCenter(CAMPUS_CENTER);
    setZoomFloat(18);
  }

  const guardado = esFavorito(destinoActivo.id);
  const edificiosPrincipales = destinosConDistancia.filter((d) => d.categoria !== 'docente');

  return (
    <View style={styles.fullScreenContainer}>
      {/* Lienzo de Mapa a Pantalla Completa con Pan (1 dedo) y Pinch-to-Zoom (2 dedos) */}
      <View
        style={styles.mapCanvas}
        onLayout={onMapLayout}
        {...panResponder.panHandlers}
      >
        {mapSize.width > 0 && (
          <>
            {TILE_OFFSETS.map((t) => {
              const tx = centerTileX + t.dx;
              const ty = centerTileY + t.dy;
              const tileLeft = centerPixelX + (tx - centerFloat.x) * TILE_PX;
              const tileTop = centerPixelY + (ty - centerFloat.y) * TILE_PX;
              const uri = `https://mt1.google.com/vt/lyrs=${tipoMapa}&hl=es&x=${tx}&y=${ty}&z=${zoomInt}`;

              return (
                <Image
                  key={`${tipoMapa}-${zoomInt}-${tx}-${ty}`}
                  source={{ uri }}
                  style={{
                    position: 'absolute',
                    left: tileLeft,
                    top: tileTop,
                    width: TILE_PX + 1,
                    height: TILE_PX + 1,
                  }}
                  resizeMode="cover"
                />
              );
            })}

            {/* Ruta estilo Google Maps */}
            {lineLength > 4 && (
              <>
                <View
                  pointerEvents="none"
                  style={[
                    styles.routeLineBorder,
                    {
                      width: lineLength,
                      left: midX - lineLength / 2,
                      top: midY - 4,
                      transform: [{ rotate: `${lineAngleDeg}deg` }],
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.routeLine,
                    {
                      width: lineLength,
                      left: midX - lineLength / 2,
                      top: midY - 2.5,
                      transform: [{ rotate: `${lineAngleDeg}deg` }],
                    },
                  ]}
                />
              </>
            )}

            {/* Marcadores interactivos de edificios */}
            {edificiosPrincipales.map((dest) => {
              const coords = geoToPixel(dest.lat, dest.lng);
              const esSeleccionado = dest.id === destinoActivo.id;
              return (
                <TouchableOpacity
                  key={dest.id}
                  activeOpacity={0.85}
                  onPress={() => seleccionarEdificio(dest)}
                  style={[
                    styles.buildingNode,
                    esSeleccionado && styles.buildingNodeSelected,
                    {
                      left: coords.left - 36,
                      top: coords.top - 13,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.buildingText,
                      esSeleccionado && styles.buildingTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {dest.edificio}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Punto Azul/Verde de Ubicacion Actual */}
            <View
              pointerEvents="none"
              style={[
                styles.userMarkerWrap,
                {
                  left: posOrigen.left - 16,
                  top: posOrigen.top - 16,
                },
              ]}
            >
              <View
                style={[
                  styles.userHalo,
                  { backgroundColor: gpsActivo && dentroDelCampus ? 'rgba(34,197,94,0.28)' : 'rgba(37,99,235,0.28)' },
                ]}
              />
              <View
                style={[
                  styles.userDot,
                  { backgroundColor: gpsActivo && dentroDelCampus ? '#22C55E' : '#2563EB' },
                ]}
              />
            </View>
          </>
        )}
      </View>

      {/* Controles Superiores Flotantes estilo Google Maps */}
      <SafeAreaView pointerEvents="box-none" style={styles.topOverlay}>
        <View style={styles.searchCard}>
          <View style={styles.searchHeaderRow}>
            <Ionicons name="navigate-circle" size={20} color="#38BDF8" />
            <View style={{ flex: 1 }}>
              <Text style={styles.searchDestTitle} numberOfLines={1}>
                {destinoActivo.nombre}
              </Text>
              <Text style={styles.searchOriginSub} numberOfLines={1}>
                Desde: {gpsActivo && dentroDelCampus ? `Tu ubicacion GPS (+/-${precisionGpsMetros ?? 5}m)` : origenActual.ubicacion}
              </Text>
            </View>
            <View style={styles.turnMiniPill}>
              <Ionicons name="walk" size={13} color="#FFFFFF" />
              <Text style={styles.turnMiniText}>{destinoActivo.direccionCardinal}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {edificiosPrincipales.map((d) => {
              const activo = d.id === destinoActivo.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.chip, activo && styles.chipActive]}
                  onPress={() => seleccionarEdificio(d)}
                >
                  <Text style={[styles.chipText, activo && styles.chipTextActive]}>
                    {d.edificio}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Botones flotantes derechos: Capa Satelite/Plano, Mi Ubicacion y Zoom + / - */}
        <View style={styles.rightControls}>
          <TouchableOpacity
            style={styles.roundFab}
            onPress={() => setTipoMapa((prev) => (prev === 'y' ? 'm' : 'y'))}
          >
            <Ionicons
              name={tipoMapa === 'y' ? 'layers' : 'earth'}
              size={20}
              color="#38BDF8"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundFab} onPress={centrarCampus}>
            <Ionicons
              name="locate"
              size={20}
              color={gpsActivo && dentroDelCampus ? '#22C55E' : '#F8FAFC'}
            />
          </TouchableOpacity>

          <View style={styles.zoomPill}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomFloat((z) => Math.min(19.5, z + 0.6))}
            >
              <Ionicons name="add" size={20} color="#F8FAFC" />
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomFloat((z) => Math.max(16, z - 0.6))}
            >
              <Ionicons name="remove" size={20} color="#F8FAFC" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Tarjeta Inferior Plegable estilo Google Maps */}
      <View style={styles.bottomSheet}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setPanelExpandido((v) => !v)}
          style={styles.dragHandleWrap}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        <View style={styles.etaRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.timeDistRow}>
              <Text style={styles.etaTime}>{destinoActivo.tiempoMinutos} min</Text>
              <Text style={styles.etaDist}>({destinoActivo.distanciaTexto})</Text>
              <Text style={styles.etaArrivalSmall}>• Llegada {destinoActivo.horaLlegada}</Text>
            </View>
            <Text style={styles.destSubInfo} numberOfLines={1}>
              {destinoActivo.edificio} ({destinoActivo.piso}) • {destinoActivo.indicacionPaso}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveIconBtn}
            onPress={() => toggleFavorito(destinoActivo.id)}
          >
            <Ionicons
              name={guardado ? 'star' : 'star-outline'}
              size={20}
              color={guardado ? '#FACC15' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>

        {panelExpandido && (
          <>
            <Text style={styles.destDesc} numberOfLines={2}>
              {destinoActivo.descripcion}
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.startNavBtn} onPress={() => router.push('/cam-ra')}>
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.startNavText}>Iniciar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/qr')}>
                <Ionicons name="qr-code-outline" size={16} color="#E2E8F0" />
                <Text style={styles.secondaryText}>Calibrar QR</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#0A1324',
  },
  mapCanvas: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  routeLineBorder: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    zIndex: 9,
  },
  routeLine: {
    position: 'absolute',
    height: 5,
    backgroundColor: '#2563EB',
    borderRadius: 3,
    zIndex: 10,
  },
  buildingNode: {
    position: 'absolute',
    width: 72,
    height: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  buildingNodeSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
    zIndex: 25,
  },
  buildingText: { color: '#F8FAFC', fontSize: 10, fontWeight: '800' },
  buildingTextSelected: { color: '#FFFFFF' },
  userMarkerWrap: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  userHalo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
    zIndex: 50,
  },
  searchCard: {
    backgroundColor: 'rgba(19, 31, 56, 0.95)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchDestTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  searchOriginSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  turnMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  turnMiniText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chipsRow: {
    gap: 6,
    paddingTop: 8,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  chipText: { color: '#CBD5E1', fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  rightControls: {
    alignSelf: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  roundFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(19, 31, 56, 0.95)',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  zoomPill: {
    width: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(19, 31, 56, 0.95)',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    elevation: 5,
  },
  zoomBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#1E293B',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(19, 31, 56, 0.96)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
    zIndex: 50,
    elevation: 8,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDistRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  etaTime: {
    color: '#22C55E',
    fontSize: 20,
    fontWeight: '800',
  },
  etaDist: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  etaArrivalSmall: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
  destSubInfo: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  saveIconBtn: {
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 10,
  },
  destDesc: {
    color: '#CBD5E1',
    fontSize: 11.5,
    marginTop: 6,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  startNavBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 999,
  },
  startNavText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
});
