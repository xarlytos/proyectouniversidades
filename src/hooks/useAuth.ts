import { useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials } from '../types/auth';

const STORAGE_KEY = 'auth_session';
const PERMISSIONS_KEY = 'user_permissions';
const DELETE_PERMISSIONS_KEY = 'delete_permissions'; // Nueva clave para permisos de eliminación

// Usuarios de demostración
const demoUsers: (User & { password: string })[] = [
  {
    id: 'admin_1',
    email: 'admin@contactos.com',
    password: 'admin123',
    nombre: 'Administrador Sistema',
    role: 'admin',
    activo: true,
    fecha_creacion: '2024-01-01',
    ultimo_acceso: new Date().toISOString()
  },
  {
    id: 'comercial_1',
    email: 'marcos@contactos.com',
    password: 'marcos123',
    nombre: 'Marcos Bejerano',
    role: 'comercial',
    activo: true,
    fecha_creacion: '2024-01-15',
    ultimo_acceso: new Date().toISOString()
  },
  {
    id: 'comercial_2',
    email: 'adrian@contactos.com',
    password: 'adrian123',
    nombre: 'Adrian Vazquez',
    role: 'comercial',
    activo: true,
    fecha_creacion: '2024-01-20',
    ultimo_acceso: new Date().toISOString()
  },
  {
    id: 'comercial_3',
    email: 'alex@contactos.com',
    password: 'alex123',
    nombre: 'Alex Cantero',
    role: 'comercial',
    activo: true,
    fecha_creacion: '2024-01-25',
    ultimo_acceso: new Date().toISOString()
  },
  {
    id: 'comercial_4',
    email: 'rafa@contactos.com',
    password: 'rafa123',
    nombre: 'Rafa Cruz',
    role: 'comercial',
    activo: true,
    fecha_creacion: '2024-01-30',
    ultimo_acceso: new Date().toISOString()
  }
];

const saveSession = (user: User) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

const loadSession = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

const clearSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Nuevas funciones para gestión de permisos de eliminación
const saveDeletePermissions = (permissions: Record<string, boolean>) => {
  try {
    localStorage.setItem(DELETE_PERMISSIONS_KEY, JSON.stringify(permissions));
  } catch (error) {
    console.error('Error saving delete permissions:', error);
  }
};

const loadDeletePermissions = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(DELETE_PERMISSIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading delete permissions:', error);
    return {};
  }
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  
  const [deletePermissions, setDeletePermissions] = useState<Record<string, boolean>>(() => loadDeletePermissions());

  // Cargar sesión al inicializar
  useEffect(() => {
    const savedUser = loadSession();
    if (savedUser) {
      setAuthState({
        user: savedUser,
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = demoUsers.find(
      u => u.email === credentials.email && u.password === credentials.password && u.activo
    );

    if (user) {
      const { password, ...userWithoutPassword } = user;
      const updatedUser = {
        ...userWithoutPassword,
        ultimo_acceso: new Date().toISOString()
      };

      saveSession(updatedUser);
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false
      });

      console.log('✅ Login successful:', updatedUser.nombre, `(${updatedUser.role})`);
      return { success: true };
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.log('❌ Login failed: Invalid credentials');
      return { success: false, error: 'Credenciales inválidas' };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    console.log('👋 User logged out');
  }, []);

  // Nueva función para actualizar contraseñas
  const updateUserPassword = useCallback((userId: string, newPassword: string): boolean => {
    if (authState.user?.role !== 'admin') {
      console.log('❌ Only admin can update passwords');
      return false;
    }

    // Actualizar en el array de usuarios demo
    const userIndex = demoUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      demoUsers[userIndex].password = newPassword;
      console.log('✅ Password updated for user:', demoUsers[userIndex].nombre);
      return true;
    }
    
    console.log('❌ User not found:', userId);
    return false;
  }, [authState.user]);

  // Nueva función para gestionar permisos de eliminación
  const toggleDeletePermission = useCallback((userId: string, canDelete: boolean) => {
    if (authState.user?.role !== 'admin') {
      console.log('❌ Only admin can manage delete permissions');
      return;
    }

    const newPermissions = { ...deletePermissions, [userId]: canDelete };
    setDeletePermissions(newPermissions);
    saveDeletePermissions(newPermissions);
    console.log(`✅ Delete permission ${canDelete ? 'granted' : 'revoked'} for user:`, userId);
  }, [authState.user, deletePermissions]);

  // Nueva función para verificar permisos de eliminación
  const getUserDeletePermission = useCallback((userId: string): boolean => {
    return deletePermissions[userId] || false;
  }, [deletePermissions]);

  // Actualizar la función hasPermission para incluir permisos de eliminación
  const hasPermission = useCallback((action: 'view' | 'edit' | 'delete', contactOwnerId?: string): boolean => {
    if (!authState.user) return false;
    
    // Admin tiene todos los permisos
    if (authState.user.role === 'admin') return true;
    
    // Para acción de eliminar, verificar permisos específicos
    if (action === 'delete') {
      return deletePermissions[authState.user.id] || false;
    }
    
    // Comercial solo puede ver/editar sus propios contactos
    if (authState.user.role === 'comercial') {
      return contactOwnerId === authState.user.id;
    }
    
    return false;
  }, [authState.user, deletePermissions]);

  const getAllUsers = useCallback((): User[] => {
    if (authState.user?.role !== 'admin') return [];
    return demoUsers.map(({ password, ...user }) => user);
  }, [authState.user]);

  // Nueva función para editar usuario
  const updateUser = useCallback((userId: string, updatedData: Partial<User>): boolean => {
    if (authState.user?.role !== 'admin') {
      console.log('❌ Only admin can update users');
      return false;
    }
  
    const userIndex = demoUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      // Actualizar datos del usuario (excepto password que se maneja por separado)
      const { password, ...userDataWithoutPassword } = demoUsers[userIndex];
      demoUsers[userIndex] = {
        ...demoUsers[userIndex],
        ...updatedData,
        id: userId, // Asegurar que el ID no cambie
        fecha_creacion: demoUsers[userIndex].fecha_creacion // Preservar fecha de creación
      };
      console.log('✅ User updated:', demoUsers[userIndex].nombre);
      return true;
    }
    
    console.log('❌ User not found:', userId);
    return false;
  }, [authState.user]);
  
  // Nueva función para eliminar usuario
  const deleteUser = useCallback((userId: string): boolean => {
    if (authState.user?.role !== 'admin') {
      console.log('❌ Only admin can delete users');
      return false;
    }
  
    if (userId === authState.user.id) {
      console.log('❌ Cannot delete current user');
      return false;
    }
  
    const userIndex = demoUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const deletedUser = demoUsers[userIndex];
      demoUsers.splice(userIndex, 1);
      
      // Limpiar permisos relacionados con este usuario
      const newPermissions = { ...deletePermissions };
      delete newPermissions[userId];
      setDeletePermissions(newPermissions);
      saveDeletePermissions(newPermissions);
      
      console.log('✅ User deleted:', deletedUser.nombre);
      return true;
    }
    
    console.log('❌ User not found:', userId);
    return false;
  }, [authState.user, deletePermissions]);
  
  // Nueva función para agregar usuario
  const addUser = useCallback((newUserData: Omit<User, 'id' | 'fecha_creacion'> & { password: string }): boolean => {
    if (authState.user?.role !== 'admin') {
      console.log('❌ Only admin can add users');
      return false;
    }
  
    // Verificar si el email ya existe
    if (demoUsers.some(user => user.email.toLowerCase() === newUserData.email.toLowerCase())) {
      console.log('❌ Email already exists:', newUserData.email);
      return false;
    }
  
    const newUser = {
      ...newUserData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fecha_creacion: new Date().toISOString()
    };
  
    demoUsers.push(newUser);
    console.log('✅ User added:', newUser.nombre);
    return true;
  }, [authState.user]);

  return {
    ...authState,
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
  };
}