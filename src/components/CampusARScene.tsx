import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ViroAmbientLight,
  ViroARScene,
  ViroBox,
  ViroMaterials,
  ViroNode,
  ViroText,
  ViroTrackingStateConstants,
} from '@reactvision/react-viro';
import { DestinoCampus } from '@/context/NavigationContext';

ViroMaterials.createMaterials({
  flechaCian: {
    diffuseColor: '#38BDF8',
    lightingModel: 'Blinn',
  },
  flechaPunta: {
    diffuseColor: '#0284C7',
    lightingModel: 'Blinn',
  },
  panelFondo: {
    diffuseColor: '#0F172A',
    lightingModel: 'Constant',
  },
});

interface CampusARSceneProps {
  sceneNavigator?: {
    viroAppProps?: {
      destino: DestinoCampus;
      onTrackingChange?: (estado: string) => void;
    };
  };
}

export default function CampusARScene(props: CampusARSceneProps) {
  const [trackingListo, setTrackingListo] = useState(false);

  const destino: DestinoCampus = props.sceneNavigator?.viroAppProps?.destino || {
    id: '1',
    nombre: 'Edificio de Sistemas y TICS',
    edificio: 'Edificio K',
    piso: 'Planta Alta',
    distanciaMetros: 45,
    anguloGrados: 0,
  };

  const onTrackingChange = props.sceneNavigator?.viroAppProps?.onTrackingChange;

  function onInitialized(state: any) {
    if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
      setTrackingListo(true);
      onTrackingChange?.('Tracking AR activo');
    } else if (state === ViroTrackingStateConstants.TRACKING_UNAVAILABLE) {
      setTrackingListo(false);
      onTrackingChange?.('Mueve el teléfono suavemente para detectar el entorno');
    }
  }

  return (
    <ViroARScene onTrackingUpdated={onInitialized}>
      <ViroAmbientLight color="#FFFFFF" intensity={400} />

      {/* Nodo principal anclado a 2.2 metros frente al usuario, rotado según el rumbo del edificio */}
      <ViroNode
        position={[0, -0.25, -2.2]}
        rotation={[0, -destino.anguloGrados, 0]}
      >
        {/* Flecha direccional 3D apuntando hacia adelante (-Z) */}
        <ViroNode position={[0, 0.35, 0]}>
          {/* Cuerpo de la flecha */}
          <ViroBox
            position={[0, 0, 0.15]}
            scale={[0.14, 0.06, 0.45]}
            materials={['flechaCian']}
          />
          {/* Ala izquierda de la punta */}
          <ViroBox
            position={[-0.11, 0, -0.15]}
            rotation={[0, 38, 0]}
            scale={[0.08, 0.06, 0.32]}
            materials={['flechaPunta']}
          />
          {/* Ala derecha de la punta */}
          <ViroBox
            position={[0.11, 0, -0.15]}
            rotation={[0, -38, 0]}
            scale={[0.08, 0.06, 0.32]}
            materials={['flechaPunta']}
          />
        </ViroNode>

        {/* Letrero flotante 3D con Edificio y Distancia */}
        <ViroNode position={[0, 0.85, 0]}>
          <ViroBox
            position={[0, 0, -0.03]}
            scale={[1.45, 0.46, 0.02]}
            materials={['panelFondo']}
          />
          <ViroText
            text={`${destino.edificio} • ${destino.distanciaMetros} m`}
            scale={[0.45, 0.45, 0.45]}
            position={[0, 0.07, 0]}
            style={styles.textoEdificio}
            width={3.2}
            height={1}
          />
          <ViroText
            text={destino.nombre}
            scale={[0.28, 0.28, 0.28]}
            position={[0, -0.09, 0]}
            style={styles.textoNombre}
            width={4.8}
            height={1}
          />
        </ViroNode>
      </ViroNode>
    </ViroARScene>
  );
}

const styles = StyleSheet.create({
  textoEdificio: {
    fontFamily: 'sans-serif-medium',
    fontSize: 28,
    color: '#38BDF8',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  textoNombre: {
    fontFamily: 'sans-serif',
    fontSize: 22,
    color: '#F8FAFC',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});
