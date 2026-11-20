import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function UserItem({ user, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.details}>{user.email}</Text>
        <Text style={styles.details}>📞 {user.phone}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => onEdit(user)}>
          <Text style={styles.btnText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={() => onDelete(user.id)}>
          <Text style={styles.btnText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3, // Sombra nativa en Android
    shadowColor: '#000', // Sombra nativa en iOS
    shadowOpacity: 0.1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  details: { fontSize: 13, color: '#666' },
  actions: { justifyContent: 'space-around' },
  btn: { padding: 8, borderRadius: 5, width: 70, alignItems: 'center' },
  btnEdit: { backgroundColor: '#007bff', marginBottom: 5 },
  btnDelete: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});
