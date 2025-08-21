import React, { useState } from 'react';
import { User } from '../types/auth';
import { Shield, Key, Users, Trash2, Check, X } from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateUserPassword: (userId: string, newPassword: string) => void;
  onToggleDeletePermission: (userId: string, canDelete: boolean) => void;
  getUserDeletePermission: (userId: string) => boolean;
}

export default function AdminPanel({ 
  users, 
  currentUser, 
  onUpdateUserPassword, 
  onToggleDeletePermission,
  getUserDeletePermission 
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'permissions' | 'passwords'>('permissions');
  const [passwordForm, setPasswordForm] = useState<{userId: string; newPassword: string; confirmPassword: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const comercialUsers = users.filter(user => user.role === 'comercial');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    onUpdateUserPassword(passwordForm.userId, passwordForm.newPassword);
    setPasswordForm(null);
    alert('Contraseña actualizada exitosamente');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-purple-600" />
          Panel de Administrador
        </h1>
        <p className="text-gray-600 mt-1">Gestión de permisos y usuarios del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Permisos de Eliminación
          </button>
          <button
            onClick={() => setActiveTab('passwords')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'passwords'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Gestión de Contraseñas
          </button>
        </nav>
      </div>

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Permisos para Eliminar Contactos</h3>
            <p className="text-sm text-blue-700">
              Gestiona qué usuarios comerciales pueden eliminar contactos del sistema.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Usuarios Comerciales</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {comercialUsers.map((user) => {
                const canDelete = getUserDeletePermission(user.id);
                return (
                  <div key={user.id} className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nombre}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        canDelete 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {canDelete ? (
                          <><Check className="w-3 h-3 mr-1" /> Puede eliminar</>
                        ) : (
                          <><X className="w-3 h-3 mr-1" /> Sin permisos</>
                        )}
                      </span>
                      <button
                        onClick={() => onToggleDeletePermission(user.id, !canDelete)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          canDelete
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {canDelete ? 'Revocar' : 'Otorgar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Passwords Tab */}
      {activeTab === 'passwords' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Gestión de Contraseñas</h3>
            <p className="text-sm text-yellow-700">
              Cambia las contraseñas de cualquier usuario del sistema. Los usuarios serán notificados del cambio.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Todos los Usuarios</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {users.filter(user => user.id !== currentUser.id).map((user) => (
                <div key={user.id} className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-purple-100' : 'bg-green-100'
                    }`}>
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Users className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.nombre}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Comercial'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPasswordForm({
                      userId: user.id,
                      newPassword: '',
                      confirmPassword: ''
                    })}
                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                  >
                    <Key className="w-4 h-4 inline mr-1" />
                    Cambiar Contraseña
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => prev ? {...prev, newPassword: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => prev ? {...prev, confirmPassword: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showPassword" className="text-sm text-gray-600">
                  Mostrar contraseñas
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordForm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}