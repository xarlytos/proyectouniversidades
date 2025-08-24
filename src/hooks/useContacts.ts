import { useState, useCallback, useEffect } from 'react';
import { Contact } from '../types';
import { sampleContacts } from '../data/sampleData';

const STORAGE_KEY = 'contacts_database';

// Utility functions for localStorage
const saveToStorage = (contacts: Contact[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    console.log('✅ Contacts saved to localStorage:', contacts.length, 'contacts');
  } catch (error) {
    console.error('❌ Failed to save contacts to localStorage:', error);
  }
};

const loadFromStorage = (): Contact[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Contacts loaded from localStorage:', parsed.length, 'contacts');
      return parsed;
    }
  } catch (error) {
    console.error('❌ Failed to load contacts from localStorage:', error);
  }
  
  // If no stored data or error, initialize with sample data
  console.log('📝 Initializing with sample data');
  saveToStorage(sampleContacts);
  return sampleContacts;
};

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => loadFromStorage());

  // Save to localStorage whenever contacts change
  useEffect(() => {
    saveToStorage(contacts);
  }, [contacts]);

  const addContact = useCallback((contactData: Omit<Contact, 'id' | 'fecha_alta'>, currentUser?: any) => {
    const newContact: Contact = {
      ...contactData,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fecha_alta: new Date().toISOString().split('T')[0],
      // Mejorar la lógica de asignación del comercial
      comercial_id: contactData.comercial ? 'excel_import' : (currentUser?.id || 'unknown'),
      // Si contactData.comercial existe (viene del Excel), usarlo directamente
      // Si no existe, usar el nombre del usuario actual o 'Usuario desconocido'
      comercial_nombre: contactData.comercial || (currentUser?.nombre || 'Usuario desconocido')
    };
    
    console.log('➕ Adding new contact:', newContact);
    
    setContacts(prev => {
      const updated = [...prev, newContact];
      console.log('📊 Total contacts after add:', updated.length);
      return updated;
    });
    
    return newContact;
  }, []);

  const updateContact = useCallback((id: string, contactData: Omit<Contact, 'id' | 'fecha_alta'>) => {
    console.log('✏️ Updating contact:', id);
    
    setContacts(prev => {
      const updated = prev.map(contact => 
        contact.id === id 
          ? { ...contact, ...contactData }
          : contact
      );
      
      const wasUpdated = updated.some(contact => contact.id === id);
      console.log('📊 Contact update result:', wasUpdated ? 'Success' : 'Failed - Contact not found');
      
      return updated;
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      console.log('🗑️ Deleting contact:', id);
      
      setContacts(prev => {
        const updated = prev.filter(contact => contact.id !== id);
        console.log('📊 Total contacts after delete:', updated.length);
        return updated;
      });
    }
  }, []);

  // Nueva función para eliminar múltiples contactos
  const deleteMultipleContacts = useCallback((ids: string[]) => {
    const count = ids.length;
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${count} contacto${count > 1 ? 's' : ''}?`)) {
      console.log('🗑️ Deleting multiple contacts:', ids);
      
      setContacts(prev => {
        const updated = prev.filter(contact => !ids.includes(contact.id));
        console.log('📊 Total contacts after multiple delete:', updated.length);
        return updated;
      });
    }
  }, []);
  // Debug function to check current state
  const debugContacts = useCallback(() => {
    console.log('🔍 Current contacts state:', {
      count: contacts.length,
      contacts: contacts.map(c => ({ id: c.id, nombre: c.nombre })),
      storage: localStorage.getItem(STORAGE_KEY) ? 'Has stored data' : 'No stored data'
    });
  }, [contacts]);

  // Export/Import functionality for backup
  const exportContacts = useCallback(() => {
    const dataStr = JSON.stringify(contacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [contacts]);

  const importContacts = useCallback((jsonData: string) => {
    try {
      const importedContacts = JSON.parse(jsonData);
      if (Array.isArray(importedContacts)) {
        setContacts(importedContacts);
        console.log('📥 Contacts imported successfully:', importedContacts.length);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to import contacts:', error);
    }
    return false;
  }, []);

  // Función para verificar duplicados
  const checkDuplicates = useCallback((telefono?: string, instagram?: string, excludeId?: string) => {
    const duplicates = {
      telefono: false,
      instagram: false
    };

    if (telefono && telefono.trim()) {
      duplicates.telefono = contacts.some(contact => 
        contact.telefono === telefono.trim() && contact.id !== excludeId
      );
    }

    if (instagram && instagram.trim()) {
      const cleanInstagram = instagram.replace('@', '').trim();
      duplicates.instagram = contacts.some(contact => {
        if (!contact.instagram) return false;
        const contactInstagram = contact.instagram.replace('@', '').trim();
        return contactInstagram === cleanInstagram && contact.id !== excludeId;
      });
    }

    return duplicates;
  }, [contacts]);

  // Función para limpiar todos los contactos
  const clearAllContacts = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los contactos? Esta acción no se puede deshacer.')) {
      console.log('🗑️ Clearing all contacts');
      setContacts([]);
      localStorage.removeItem(STORAGE_KEY);
      console.log('📊 All contacts cleared');
    }
  }, []);

  return {
    contacts,
    addContact,
    updateContact,
    deleteContact,
    deleteMultipleContacts,
    checkDuplicates,
    debugContacts,
    exportContacts,
    importContacts,
    clearAllContacts
  };
}