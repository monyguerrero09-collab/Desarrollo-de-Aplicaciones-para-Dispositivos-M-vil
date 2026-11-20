import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  Image, Alert, Linking, Modal, FlatList 
} from 'react-native';

// Herramientas nativas de Expo
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  // --- ESTADOS DE LA APLICACIÓN ---
  const [fotoUri, setFotoUri] = useState(null);
  
  // Estados para GPS y Geocoding (Reto 2)
  const [ubicacion, setUbicacion] = useState(null);
  const [direccion, setDireccion] = useState(null);

  // Estados para Contactos y Modal (Reto 3)
  const [contacto, setContacto] = useState(null);
  const [listaContactos, setListaContactos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // =========================================================================
  // 1. CÁMARA Y GALERÍA (INCLUYE RETO 1: SELECTOR DUAL)
  // =========================================================================
  const manejarCamara = async () => {
    try {
      const permisoCamara = await ImagePicker.requestCameraPermissionsAsync();
      const permisoGaleria = await MediaLibrary.requestPermissionsAsync();

      if (!permisoCamara.granted || !permisoGaleria.granted) {
        Alert.alert(
          "Sin permisos para cámara", 
          "Necesitamos acceso a tu cámara y galería. ¿Deseas ir a la configuración?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!resultado.canceled) {
        const uri = resultado.assets[0].uri;
        setFotoUri(uri);
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("¡Éxito!", "La foto se ha guardado en tu galería.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al usar la cámara.");
    }
  };

  // Reto 1: Elegir foto desde la galería
  const manejarGaleria = async () => {
    try {
      const permisoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permisoGaleria.granted) {
        Alert.alert(
          "Sin permisos para galería",
          "Habilita el acceso a tus fotos en los ajustes del teléfono.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!resultado.canceled) {
        setFotoUri(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo abrir la galería.");
    }
  };

  // =========================================================================
  // 2. GEOLOCALIZACIÓN Y REVERSE GEOCODING (INCLUYE RETO 2)
  // =========================================================================
  const manejarUbicacion = async () => {
    try {
      const permisoGps = await Location.requestForegroundPermissionsAsync();

      if (!permisoGps.granted) {
        Alert.alert(
          "Sin permisos para GPS", 
          "Necesitamos tu ubicación. Habilita el permiso en los ajustes.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      Alert.alert("Buscando...", "Obteniendo coordenadas satelitales y dirección...");
      const ubicacionActual = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = ubicacionActual.coords;
      
      setUbicacion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

      // Reto 2: Traducir coordenadas a calle, ciudad y código postal
      const resultadoGeocoding = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (resultadoGeocoding.length > 0) {
        const lugar = resultadoGeocoding[0];
        const calle = lugar.street ? `${lugar.street} ${lugar.streetNumber || ''}`.trim() : 'Calle desconocida';
        const ciudad = lugar.city || lugar.subregion || '';
        const cp = lugar.postalCode ? `C.P. ${lugar.postalCode}` : '';
        
        setDireccion(`${calle}, ${ciudad} ${cp}`.trim());
      } else {
        setDireccion("Dirección no disponible para estas coordenadas.");
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo obtener la ubicación. Verifica que el GPS esté encendido.");
    }
  };

  // =========================================================================
  // 3. AGENDA DE CONTACTOS CON MODAL (INCLUYE RETO 3)
  // =========================================================================
  const manejarContactos = async () => {
    try {
      const permisoContactos = await Contacts.requestPermissionsAsync();

      if (!permisoContactos.granted) {
        Alert.alert(
          "Sin permisos para contactos", 
          "Necesitamos acceso a tu agenda. Actívalo en la configuración.",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Abrir Ajustes", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      const contactosValidos = data.filter(
        (c) => c.phoneNumbers && c.phoneNumbers.length > 0
      );

      if (contactosValidos.length > 0) {
        setListaContactos(contactosValidos);
        setModalVisible(true);
      } else {
        Alert.alert("Aviso", "No se encontraron contactos con número telefónico.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al acceder a los contactos.");
    }
  };

  const seleccionarContacto = (item) => {
    setContacto({
      nombre: item.name || "Sin nombre",
      telefono: item.phoneNumbers[0].number,
    });
    setModalVisible(false);
  };

  // =========================================================================
  // INTERFAZ DE USUARIO (UI)
  // =========================================================================
  return (
    <ScrollView style={styles.contenedorPantalla}>
      <Text style={styles.tituloPrincipal}>Caja de Herramientas Nativas</Text>

      {/* --- TARJETA 1: CÁMARA Y GALERÍA --- */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>1. Cámara y Galería</Text>
        
        <View style={styles.filaBotones}>
          <TouchableOpacity style={[styles.boton, styles.botonMitad]} onPress={manejarCamara}>
            <Text style={styles.textoBoton}>Tomar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.botonSecundario, styles.botonMitad]} onPress={manejarGaleria}>
            <Text style={styles.textoBoton}>Elegir de Galería</Text>
          </TouchableOpacity>
        </View>
        
        {fotoUri && (
          <Image source={{ uri: fotoUri }} style={styles.imagenPreview} />
        )}
      </View>

      {/* --- TARJETA 2: GPS Y MAPA --- */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>2. Geolocalización</Text>
        <TouchableOpacity style={styles.boton} onPress={manejarUbicacion}>
          <Text style={styles.textoBoton}>Obtener Mi Ubicación</Text>
        </TouchableOpacity>

        {direccion && (
          <View style={styles.cajaDireccion}>
            <Text style={styles.etiquetaDireccion}>Ubicación detectada:</Text>
            <Text style={styles.textoDireccion}>{direccion}</Text>
          </View>
        )}

        {ubicacion && (
          <MapView 
            style={styles.mapa} 
            region={ubicacion}
            showsUserLocation={true}
          >
            <Marker coordinate={ubicacion} title="¡Estás aquí!" description={direccion || ''} />
          </MapView>
        )}
      </View>

      {/* --- TARJETA 3: CONTACTOS --- */}
      <View style={styles.tarjeta}>
        <Text style={styles.tituloTarjeta}>3. Agenda Telefónica</Text>
        <TouchableOpacity style={styles.boton} onPress={manejarContactos}>
          <Text style={styles.textoBoton}>Seleccionar un Contacto</Text>
        </TouchableOpacity>

        {contacto && (
          <View style={styles.cajaContacto}>
            <Text style={styles.textoDestacado}>Nombre: {contacto.nombre}</Text>
            <Text style={styles.textoDestacado}>Teléfono: {contacto.telefono}</Text>
          </View>
        )}
      </View>

      {/* --- MODAL PARA LISTAR CONTACTOS (RETO 3) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <Text style={styles.modalTitulo}>Selecciona un Contacto</Text>
            
            <FlatList
              data={listaContactos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.itemContacto} 
                  onPress={() => seleccionarContacto(item)}
                >
                  <Text style={styles.itemNombre}>{item.name}</Text>
                  <Text style={styles.itemTelefono}>{item.phoneNumbers[0].number}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              style={styles.botonCerrarModal} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textoBoton}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// =========================================================================
// HOJA DE ESTILOS
// =========================================================================
const styles = StyleSheet.create({
  contenedorPantalla: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  tituloPrincipal: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
  },
  tituloTarjeta: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#374151',
  },
  filaBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  botonMitad: {
    flex: 1,
  },
  boton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  botonSecundario: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  imagenPreview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginTop: 5,
    resizeMode: 'cover',
  },
  cajaDireccion: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 10,
  },
  etiquetaDireccion: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  textoDireccion: {
    fontSize: 14,
    color: '#1E3A8A',
  },
  mapa: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginTop: 5,
  },
  cajaContacto: {
    backgroundColor: '#E5E7EB',
    padding: 15,
    borderRadius: 8,
    marginTop: 5,
  },
  textoDestacado: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 5,
    fontWeight: '500'
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContenido: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
    textAlign: 'center',
  },
  itemContacto: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemTelefono: {
    fontSize: 14,
    color: '#6B7280',
  },
  botonCerrarModal: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  }
});