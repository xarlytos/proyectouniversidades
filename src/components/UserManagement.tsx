import React, { useState } from 'react';
import { Users, Shield, Edit, Trash2, Plus, Eye, EyeOff, X } from 'lucide-react';
import { User } from '../types/auth';
import { usePermissions } from '../hooks/usePermissions';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser?: (newUser: Omit<User, 'id' | 'fecha_creacion'> & { password: string }) => boolean;
  onUpdateUser?: (userId: string, updatedData: Partial<User>) => boolean;
  onDeleteUser?: (userId: string) => boolean;
}

interface EditUserForm {
  nombre: string;
  email: string;
  role: 'admin' | 'comercial';
  activo: boolean;
}

export default function UserManagement({ 
  users, 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}: UserManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    nombre: '',
    email: '',
    role: 'comercial',
    activo: true
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    nombre: '',
    email: '',
    password: '',
    role: 'comercial'
  });
  const [formErrors, setFormErrors] = useState<Partial<NewUserForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    grantPermission, 
    revokePermission, 
    hasPermission, 
    hasPermissionWithHierarchy,
    getAllPermissions,
    assignComercialToJefe,
    removeComercialFromJefe,
    getComercialJefe,
    getJefeSubordinados
  } = usePermissions();

  const comerciales = users.filter(user => user.role === 'comercial');
  const admins = users.filter(user => user.role === 'admin');

  const handlePermissionChange = (fromUserId: string, toUserId: string, granted: boolean) => {
    if (granted) {
      grantPermission(fromUserId, toUserId, currentUser.id);
      console.log(`✅ Permission granted: User ${toUserId} can now see contacts from ${fromUserId}`);
    } else {
      revokePermission(fromUserId, toUserId);
      console.log(`❌ Permission revoked: User ${toUserId} can no longer see contacts from ${fromUserId}`);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewUserForm> = {};
    
    if (!newUserForm.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!newUserForm.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) {
      errors.email = 'El email no es válido';
    } else if (users.some(user => user.email.toLowerCase() === newUserForm.email.toLowerCase())) {
      errors.email = 'Este email ya está registrado';
    }
    
    if (!newUserForm.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (newUserForm.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newUser: Omit<User, 'id' | 'fecha_creacion'> = {
        nombre: newUserForm.nombre.trim(),
        email: newUserForm.email.toLowerCase().trim(),
        role: newUserForm.role,
        activo: true,
        ultimo_acceso: undefined
      };
      
      // Si hay una función onAddUser proporcionada, la usamos
      if (onAddUser) {
        onAddUser(newUser);
      } else {
        // Simulamos la creación del usuario (en una app real esto sería una llamada a la API)
        const userWithId: User = {
          ...newUser,
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fecha_creacion: new Date().toISOString()
        };
        
        console.log('✅ Usuario creado:', userWithId);
        // Aquí normalmente actualizarías el estado global de usuarios
      }
      
      // Resetear formulario y cerrar modal
      setNewUserForm({
        nombre: '',
        email: '',
        password: '',
        role: 'comercial'
      });
      setFormErrors({});
      setShowAddForm(false);
      
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setNewUserForm({
      nombre: '',
      email: '',
      password: '',
      role: 'comercial'
    });
    setFormErrors({});
  };

  const handleJefeAssignment = (comercialId: string, jefeId: string | null) => {
    if (jefeId) {
      assignComercialToJefe(comercialId, jefeId, currentUser.id);
      console.log(`👥 Comercial ${comercialId} asignado a jefe ${jefeId}`);
    } else {
      removeComercialFromJefe(comercialId);
      console.log(`🗑️ Comercial ${comercialId} removido de jerarquía`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios y permisos del sistema</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Modal de Nuevo Usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Usuario</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitNewUser} className="p-6 space-y-4">
              {/* Campo Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={newUserForm.nombre}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.nombre ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                )}
              </div>

              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="juan@empresa.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              {/* Campo Rol */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  id="role"
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'comercial' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="comercial">Comercial</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comerciales</p>
              <p className="text-2xl font-bold text-gray-900">{comerciales.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Users className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Comercial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.ultimo_acceso 
                      ? new Date(user.ultimo_acceso).toLocaleDateString('es-ES')
                      : 'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        disabled={user.id === currentUser.id}
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gestión de Permisos - NUEVA SECCIÓN */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Gestión de Permisos entre Comerciales</h3>
          <p className="text-sm text-gray-600 mt-1">
            Asigna comerciales a jefes para gestionar la visibilidad de contactos
          </p>
        </div>
        
        <div className="p-6">
          {/* Sección de Asignación de Jerarquía */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-4">Asignación de Jerarquía</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {comerciales.map(comercial => {
                const jefeActual = getComercialJefe(comercial.id);
                const jefeInfo = jefeActual ? users.find(u => u.id === jefeActual) : null;
                
                return (
                  <div key={comercial.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-gray-900">{comercial.nombre}</h5>
                          <p className="text-xs text-gray-500">{comercial.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Trabaja para:
                      </label>
                      <select
                        value={jefeActual || ''}
                        onChange={(e) => handleJefeAssignment(comercial.id, e.target.value || null)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Nadie asignado</option>
                        {comerciales
                          .filter(c => c.id !== comercial.id)
                          .map(jefe => (
                            <option key={jefe.id} value={jefe.id}>
                              {jefe.nombre}
                            </option>
                          ))
                        }
                      </select>
                      
                      {jefeInfo && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          📋 Reporta a: <strong>{jefeInfo.nombre}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección de Visualización de Jerarquías */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-4">Estructura Jerárquica</h4>
            <div className="space-y-4">
              {comerciales
                .filter(comercial => getJefeSubordinados(comercial.id).length > 0)
                .map(jefe => {
                  const subordinados = getJefeSubordinados(jefe.id);
                  
                  return (
                    <div key={jefe.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-gray-900">{jefe.nombre} (Jefe)</h5>
                          <p className="text-xs text-gray-500">Puede ver sus contactos + {subordinados.length} comercial(es)</p>
                        </div>
                      </div>
                      
                      <div className="ml-11 space-y-2">
                        {subordinados.map(subordinadoId => {
                          const subordinado = users.find(u => u.id === subordinadoId);
                          return subordinado ? (
                            <div key={subordinadoId} className="flex items-center text-sm text-gray-600">
                              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                <Users className="w-2 h-2 text-green-600" />
                              </div>
                              {subordinado.nombre}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                })
              }
              
              {comerciales.filter(c => getJefeSubordinados(c.id).length > 0).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay jerarquías configuradas</p>
                  <p className="text-sm">Asigna comerciales a jefes para crear la estructura</p>
                </div>
              )}
            </div>
          </div>

          {/* Debug Section - Actualizada */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Debug - Estado Actual:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">Jerarquías:</div>
              {comerciales.map(comercial => {
                const jefe = getComercialJefe(comercial.id);
                const jefeNombre = jefe ? users.find(u => u.id === jefe)?.nombre : 'No trabaja para nadie';
                return (
                  <div key={comercial.id}>
                    {comercial.nombre} → {jefeNombre}
                  </div>
                );
              })}
              
              <div className="font-medium mt-2">Permisos Explícitos:</div>
              {getAllPermissions().map(perm => (
                <div key={perm.id}>
                  Usuario {users.find(u => u.id === perm.comercial_id)?.nombre} puede ver contactos de: {
                    perm.puede_ver_contactos_de.map(id => users.find(u => u.id === id)?.nombre).join(', ')
                  }
                </div>
              ))}
              {getAllPermissions().length === 0 && (
                <div>No hay permisos explícitos configurados</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}