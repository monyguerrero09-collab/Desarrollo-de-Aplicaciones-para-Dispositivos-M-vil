import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface DestinoCampus {
  id: string;
  nombre: string;
  edificio: string;
  piso: string;
  descripcion: string;
  categoria?: 'general' | 'docente';
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export interface PuntoAnclajeQR {
  codigo: string;
  ubicacion: string;
  referencia: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

// Punto oficial del pin "Instituto Tecnologico de San Juan del Rio" (Edificio M)
const EDIFICIO_M_GPS = {
  latitude: 20.37395,
  longitude: -99.98405,
};

function metrosDesdeEdificioM(dxMetros: number, dyMetros: number) {
  const lat = EDIFICIO_M_GPS.latitude + dyMetros / 111132.92;
  const lng =
    EDIFICIO_M_GPS.longitude +
    dxMetros / (111412.84 * Math.cos((EDIFICIO_M_GPS.latitude * Math.PI) / 180));
  return { lat, lng };
}

function crearDestino(
  id: string,
  nombre: string,
  edificio: string,
  piso: string,
  descripcion: string,
  dx: number,
  dy: number,
  categoria: 'general' | 'docente' = 'general'
): DestinoCampus {
  const { lat, lng } = metrosDesdeEdificioM(dx, dy);
  return { id, nombre, edificio, piso, descripcion, categoria, x: dx, y: dy, lat, lng };
}

export const DESTINOS_CAMPUS: DestinoCampus[] = [
  crearDestino(
    '1',
    'Biblioteca (Centro de Informaci\u00f3n)',
    'Biblioteca',
    'Planta Baja / Alta',
    'Acervo bibliografico, salas de lectura, prestamo de equipo y cubiculos',
    -42,
    82
  ),
  crearDestino(
    '2',
    'Gimnasio Auditorio Mario Molina',
    'Auditorio',
    'Planta Unica',
    'Eventos institucionales, ceremonias y actividades deportivas techadas',
    -84,
    88
  ),
  crearDestino(
    '3',
    'Cafeter\u00eda ITSJR',
    'Cafeter\u00eda',
    'Planta Baja',
    'Comedor estudiantil y area de alimentos junto al Auditorio',
    -64,
    56
  ),
  crearDestino(
    '4',
    'Palapa Estudiantil',
    'Palapa',
    'Exterior',
    'Area de descanso y convivencia frente al Edificio Q',
    -64,
    38
  ),
  crearDestino(
    '5',
    'Edificio Q',
    'Edificio Q',
    'Planta Baja / Alta',
    'Aulas y laboratorios academicos junto a la Palapa',
    -38,
    40
  ),
  crearDestino(
    '6',
    'Edificio P',
    'Edificio P',
    'Planta Baja / Alta',
    'Servicios Escolares, oficinas administrativas y cubiculos docentes',
    -8,
    72
  ),
  crearDestino(
    '7',
    'Edificio N',
    'Edificio N',
    'Planta Baja / Alta',
    'Aulas academicas en el andador central',
    -12,
    38
  ),
  crearDestino(
    '8',
    'Edificio E',
    'Edificio E',
    'Planta Alta',
    'Aulas y laboratorios de Sistemas y TICS al noreste',
    45,
    86
  ),
  crearDestino(
    '9',
    'Edificio F',
    'Edificio F',
    'Planta Baja / Alta',
    'Aulas y laboratorios al oriente de la explanada central',
    26,
    46
  ),
  crearDestino(
    '10',
    'Edificio M (Principal)',
    'Edificio M',
    'Planta Baja / Alta',
    'Edificio academico y administrativo principal sur',
    0,
    0
  ),
  crearDestino(
    '11',
    'Cub\u00edculo Ing. Gaspar',
    'Edificio P',
    'Planta Alta',
    'Asesorias academicas, proyectos e ingenieria de software',
    -6,
    74,
    'docente'
  ),
  crearDestino(
    '12',
    'Servicios Escolares',
    'Edificio P',
    'Planta Baja',
    'Constancias, reinscripciones, kardex y tramites escolares',
    -10,
    70,
    'docente'
  ),
];

export const PUNTOS_QR_CAMPUS: Record<string, PuntoAnclajeQR> = {
  'TECNM-QR-PLAZA': {
    codigo: 'TECNM-QR-PLAZA',
    ubicacion: 'Explanada Central (Biblioteca - Edificio P)',
    referencia: 'Andador central del campus',
    x: -24,
    y: 56,
    ...metrosDesdeEdificioM(-24, 56),
  },
  'TECNM-QR-BIBLIOTECA': {
    codigo: 'TECNM-QR-BIBLIOTECA',
    ubicacion: 'Entrada Biblioteca ITSJR',
    referencia: 'Portico Centro de Informacion',
    x: -42,
    y: 74,
    ...metrosDesdeEdificioM(-42, 74),
  },
  'TECNM-QR-ENTRADA': {
    codigo: 'TECNM-QR-ENTRADA',
    ubicacion: 'Acceso Norte Av. Tecnol\u00f3gico',
    referencia: 'Andador hacia Edificio P y Edificio E',
    x: 8,
    y: 96,
    ...metrosDesdeEdificioM(8, 96),
  },
  'TECNM-QR-CAFETERIA': {
    codigo: 'TECNM-QR-CAFETERIA',
    ubicacion: 'Acceso Cafeter\u00eda / Palapa',
    referencia: 'Frente a Edificio Q',
    x: -58,
    y: 52,
    ...metrosDesdeEdificioM(-58, 52),
  },
};

export interface DestinoCalculado extends DestinoCampus {
  distanciaMetros: number;
  distanciaTexto: string;
  tiempoMinutos: number;
  horaLlegada: string;
  anguloGrados: number;
  direccionCardinal: string;
  indicacionPaso: string;
}

interface NavigationContextType {
  origenActual: PuntoAnclajeQR;
  destinoActivo: DestinoCalculado;
  destinosConDistancia: DestinoCalculado[];
  favoritosIds: string[];
  favoritosDestinos: DestinoCalculado[];
  docentesDestinos: DestinoCalculado[];
  historialDestinos: DestinoCalculado[];
  gpsActivo: boolean;
  dentroDelCampus: boolean;
  precisionGpsMetros: number | null;
  errorGps: string | null;
  activarGPS: () => Promise<void>;
  desactivarGPS: () => void;
  esFavorito: (id: string) => boolean;
  toggleFavorito: (id: string) => void;
  setDestinoPorId: (id: string) => void;
  limpiarHistorial: () => void;
  recalibrarConQR: (rawData: string) => { valido: boolean; punto?: PuntoAnclajeQR; textoLeido: string };
}

const FAVORITOS_FILE = `${FileSystem.documentDirectory}tecnm_favoritos.json`;
const HISTORIAL_FILE = `${FileSystem.documentDirectory}tecnm_historial.json`;

function distanciaHaversineMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function rumboGeografico(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (Math.round(brng) + 360) % 360;
}

function gradosACardinal(grados: number): string {
  const dirs = ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'];
  const idx = Math.round(grados / 45) % 8;
  return dirs[idx];
}

function calcularVector(origen: PuntoAnclajeQR, destino: DestinoCampus): DestinoCalculado {
  const rectaMetros = distanciaHaversineMetros(origen.lat, origen.lng, destino.lat, destino.lng);
  const distanciaMetros = Math.max(4, Math.round(rectaMetros * 1.15));

  const distanciaTexto =
    distanciaMetros >= 1000
      ? `${(distanciaMetros / 1000).toFixed(2)} km`
      : `${distanciaMetros} m`;

  const tiempoMinutos = Math.max(1, Math.ceil(distanciaMetros / 75));

  const llegada = new Date(Date.now() + tiempoMinutos * 60000);
  const horas = llegada.getHours().toString().padStart(2, '0');
  const mins = llegada.getMinutes().toString().padStart(2, '0');
  const horaLlegada = `${horas}:${mins}`;

  const anguloGrados = rumboGeografico(origen.lat, origen.lng, destino.lat, destino.lng);
  const direccionCardinal = gradosACardinal(anguloGrados);
  const indicacionPaso = `Camina hacia el ${direccionCardinal} por el andador rumbo a ${destino.edificio}`;

  return {
    ...destino,
    distanciaMetros,
    distanciaTexto,
    tiempoMinutos,
    horaLlegada,
    anguloGrados,
    direccionCardinal,
    indicacionPaso,
  };
}

const NavigationContext = createContext<NavigationContextType>({} as NavigationContextType);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [origenActual, setOrigenActual] = useState<PuntoAnclajeQR>(PUNTOS_QR_CAMPUS['TECNM-QR-PLAZA']);
  const [destinoId, setDestinoId] = useState<string>('1');
  const [favoritosIds, setFavoritosIds] = useState<string[]>(['11', '12']);
  const [historialIds, setHistorialIds] = useState<string[]>(['1', '6']);

  const [gpsActivo, setGpsActivo] = useState(false);
  const [dentroDelCampus, setDentroDelCampus] = useState(true);
  const [precisionGpsMetros, setPrecisionGpsMetros] = useState<number | null>(null);
  const [errorGps, setErrorGps] = useState<string | null>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    async function cargarDatosLocales() {
      try {
        const infoFav = await FileSystem.getInfoAsync(FAVORITOS_FILE);
        if (infoFav.exists) {
          const contenido = await FileSystem.readAsStringAsync(FAVORITOS_FILE);
          const ids = JSON.parse(contenido);
          if (Array.isArray(ids)) setFavoritosIds(ids);
        }
        const infoHist = await FileSystem.getInfoAsync(HISTORIAL_FILE);
        if (infoHist.exists) {
          const contenidoH = await FileSystem.readAsStringAsync(HISTORIAL_FILE);
          const idsH = JSON.parse(contenidoH);
          if (Array.isArray(idsH)) setHistorialIds(idsH);
        }
      } catch {}
    }
    cargarDatosLocales();
    activarGPS();

    return () => {
      watchSubRef.current?.remove();
    };
  }, []);

  function procesarCoordenadaGPS(latitude: number, longitude: number, accuracy: number | null) {
    const distAlCampus = distanciaHaversineMetros(
      latitude,
      longitude,
      EDIFICIO_M_GPS.latitude,
      EDIFICIO_M_GPS.longitude
    );

    const precision = accuracy ? Math.round(accuracy) : null;
    setPrecisionGpsMetros(precision);

    // Solo acepta coordenadas dentro del perimetro del ITSJR (350 m); nunca te saca del plantel
    if (distAlCampus <= 350) {
      setDentroDelCampus(true);
      const metrosPorGradoLat = 111132.92;
      const metrosPorGradoLon = 111412.84 * Math.cos((EDIFICIO_M_GPS.latitude * Math.PI) / 180);
      const dx = Math.round((longitude - EDIFICIO_M_GPS.longitude) * metrosPorGradoLon);
      const dy = Math.round((latitude - EDIFICIO_M_GPS.latitude) * metrosPorGradoLat);

      setOrigenActual({
        codigo: 'GPS-CAMPUS',
        ubicacion: 'Tu ubicaci\u00f3n en el ITSJR',
        referencia: precision ? `GPS activo (+/-${precision} m)` : 'GPS activo en campus',
        x: dx,
        y: dy,
        lat: latitude,
        lng: longitude,
      });
    } else {
      setDentroDelCampus(false);
      setOrigenActual({
        ...PUNTOS_QR_CAMPUS['TECNM-QR-PLAZA'],
        ubicacion: 'Explanada Central (Modo Campus)',
        referencia: 'Fuera del plantel - vista interna del ITSJR',
      });
    }
  }

  async function activarGPS() {
    setErrorGps(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorGps('Permiso de ubicacion denegado');
        setGpsActivo(false);
        return;
      }

      const ultima = await Location.getLastKnownPositionAsync();
      if (ultima) {
        procesarCoordenadaGPS(
          ultima.coords.latitude,
          ultima.coords.longitude,
          ultima.coords.accuracy ?? null
        );
      }

      watchSubRef.current?.remove();
      setGpsActivo(true);

      watchSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 3000,
          distanceInterval: 4,
        },
        (loc) => {
          const { latitude, longitude, accuracy } = loc.coords;
          if (accuracy && accuracy > 35) return;
          procesarCoordenadaGPS(latitude, longitude, accuracy ?? null);
        }
      );
    } catch {
      setErrorGps('Enciende el GPS del telefono');
      setGpsActivo(false);
    }
  }

  function desactivarGPS() {
    watchSubRef.current?.remove();
    watchSubRef.current = null;
    setGpsActivo(false);
    setPrecisionGpsMetros(null);
  }

  function toggleFavorito(id: string) {
    setFavoritosIds((prev) => {
      const actualizados = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      FileSystem.writeAsStringAsync(FAVORITOS_FILE, JSON.stringify(actualizados)).catch(() => {});
      return actualizados;
    });
  }

  function esFavorito(id: string) {
    return favoritosIds.includes(id);
  }

  const destinosConDistancia = useMemo(
    () => DESTINOS_CAMPUS.map((d) => calcularVector(origenActual, d)),
    [origenActual]
  );

  const favoritosDestinos = useMemo(
    () =>
      favoritosIds
        .map((id) => destinosConDistancia.find((d) => d.id === id))
        .filter((d): d is DestinoCalculado => Boolean(d)),
    [destinosConDistancia, favoritosIds]
  );

  const docentesDestinos = useMemo(
    () => destinosConDistancia.filter((d) => d.categoria === 'docente'),
    [destinosConDistancia]
  );

  const historialDestinos = useMemo(
    () =>
      historialIds
        .map((id) => destinosConDistancia.find((d) => d.id === id))
        .filter((d): d is DestinoCalculado => Boolean(d)),
    [destinosConDistancia, historialIds]
  );

  const destinoActivo = useMemo(
    () => destinosConDistancia.find((d) => d.id === destinoId) || destinosConDistancia[0],
    [destinosConDistancia, destinoId]
  );

  function setDestinoPorId(id: string) {
    setDestinoId(id);
    setHistorialIds((prev) => {
      const nuevo = [id, ...prev.filter((item) => item !== id)].slice(0, 10);
      FileSystem.writeAsStringAsync(HISTORIAL_FILE, JSON.stringify(nuevo)).catch(() => {});
      return nuevo;
    });
  }

  function limpiarHistorial() {
    setHistorialIds([]);
    FileSystem.writeAsStringAsync(HISTORIAL_FILE, JSON.stringify([])).catch(() => {});
  }

  function recalibrarConQR(rawData: string) {
    if (gpsActivo) {
      desactivarGPS();
    }

    const clave = rawData.trim().toUpperCase();
    const puntoEncontrado = PUNTOS_QR_CAMPUS[clave];

    if (puntoEncontrado) {
      setOrigenActual(puntoEncontrado);
      return { valido: true, punto: puntoEncontrado, textoLeido: clave };
    }

    const nodoPrueba: PuntoAnclajeQR = {
      codigo: clave,
      ubicacion: 'Punto QR Explanada Central',
      referencia: `Codigo: ${rawData.slice(0, 24)}`,
      ...PUNTOS_QR_CAMPUS['TECNM-QR-PLAZA'],
    };
    setOrigenActual(nodoPrueba);
    return { valido: true, punto: nodoPrueba, textoLeido: rawData };
  }

  return (
    <NavigationContext.Provider
      value={{
        origenActual,
        destinoActivo,
        destinosConDistancia,
        favoritosIds,
        favoritosDestinos,
        docentesDestinos,
        historialDestinos,
        gpsActivo,
        dentroDelCampus,
        precisionGpsMetros,
        errorGps,
        activarGPS,
        desactivarGPS,
        esFavorito,
        toggleFavorito,
        setDestinoPorId,
        limpiarHistorial,
        recalibrarConQR,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useCampusNavigation() {
  return useContext(NavigationContext);
}
