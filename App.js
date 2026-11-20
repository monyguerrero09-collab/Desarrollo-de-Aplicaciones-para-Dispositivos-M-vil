import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import UserItem from './src/components/UserItem';
import UserModal from './src/components/UserModal';

export default function App() {
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error(error));
  }, []);

  const handleOpenAdd = () => { setCurrentUser(null); setIsModalVisible(true); };
  const handleOpenEdit = (user) => { setCurrentUser(user); setIsModalVisible(true); };

  const handleSaveUser = (userFormData) => {
    if (userFormData.id) {
      setUsers(users.map(u => u.id === userFormData.id ? userFormData : u));
    } else {
      setUsers([{ ...userFormData, id: Date.now() }, ...users]);
    }
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <TouchableOpacity style={styles.btnAdd} onPress={handleOpenAdd}>
          <Text style={styles.btnAddText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <UserItem user={item} onEdit={handleOpenEdit} onDelete={handleDeleteUser} />
        )}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
      />

      <UserModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSave={handleSaveUser} 
        currentUser={currentUser} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  btnAdd: { backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  btnAddText: { color: '#fff', fontWeight: 'bold' }
});
