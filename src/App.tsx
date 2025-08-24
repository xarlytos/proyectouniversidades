import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import ContactsPage from './components/ContactsPage';
import CountPage from './components/CountPage';
import UserManagement from './components/UserManagement';
import AdminPanel from './components/AdminPanel';
import { useContacts } from './hooks/useContacts';
import { usePermissions } from './hooks/usePermissions';
import { ContactFilters } from './types';

function App() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    hasPermission, 
    getAllUsers,
    updateUserPassword,
    toggleDeletePermission,
    getUserDeletePermission,
    updateUser,
    deleteUser,
    addUser
  } = useAuth();
  const { getUserPermissions } = usePermissions();
  const [currentPage, setCurrentPage] = useState<'contactos' | 'conteo' | 'usuarios' | 'admin'>('contactos');
  const [contactsFilters, setContactsFilters] = useState<Partial<ContactFilters>>({});
  const { contacts, addContact, updateContact, deleteContact, deleteMultipleContacts } = useContacts();

  const handleNavigateToContacts = (filters: Partial<ContactFilters>) => {
    setContactsFilters(filters);
    setCurrentPage('contactos');
  };

  // Mostrar página de login si no está autenticado
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isLoading={isLoading} />;
  }

  // Eliminar las secciones de loading y error ya que useContacts no las tiene
  // El hook useContacts carga los datos instantáneamente desde localStorage

  // Filtrar contactos según permisos del usuario
  const filteredContacts = user?.role === 'admin' 
    ? contacts 
    : contacts.filter(contact => {
        // El comercial puede ver sus propios contactos
        if (contact.comercial_id === user?.id) {
          return true;
        }
        
        // Verificar si el usuario actual tiene permisos para ver contactos de otros comerciales
        if (user?.id && contact.comercial_id) {
          // Verificar si el usuario actual tiene permiso para ver contactos del propietario del contacto
          return hasPermission(user.id, contact.comercial_id);
        }
        
        return false;
      });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={user}
        onLogout={logout}
      />
      
      <main className="flex-1 overflow-auto">
        {currentPage === 'contactos' && (
          <ContactsPage
            contacts={filteredContacts}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
            onDeleteMultipleContacts={deleteMultipleContacts} // Agregar esta línea
            initialFilters={contactsFilters}
            currentUser={user}
            hasPermission={(action, contactOwnerId) => {
              if (user?.role === 'admin') return true;
              if (action === 'view') return hasPermissionWithHierarchy(user?.id || '', contactOwnerId || '');
              if (action === 'edit') return user?.id === contactOwnerId;
              return false;
            }}
          />
        )}
        
        {currentPage === 'conteo' && (
          <CountPage
            contacts={filteredContacts}
            onNavigateToContacts={handleNavigateToContacts}
          />
        )}
        
        {currentPage === 'admin' && user?.role === 'admin' && (
          <AdminPanel
            users={getAllUsers()}
            currentUser={user}
            onUpdateUserPassword={updateUserPassword}
            onToggleDeletePermission={toggleDeletePermission}
            getUserDeletePermission={getUserDeletePermission}
          />
        )}
        
        {currentPage === 'usuarios' && user?.role === 'admin' && (
          <UserManagement
            users={getAllUsers()}
            currentUser={user}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        )}
      </main>
    </div>
  );
}

export default App;