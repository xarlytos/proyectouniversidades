import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Users, Shield, AlertCircle } from 'lucide-react';
import { LoginCredentials } from '../types/auth';

interface LoginPageProps {
  onLogin: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export default function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    const result = await onLogin(credentials);
    if (!result.success) {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'comercial') => {
    if (type === 'admin') {
      setCredentials({
        email: 'admin@contactos.com',
        password: 'admin123'
      });
    } else {
      setCredentials({
        email: 'marcos@contactos.com',
        password: 'marcos123'
      });
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Base de Contactos</h1>
          <p className="text-gray-600">Sistema de Gestión Universitaria</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="tu@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showDemoCredentials ? 'Ocultar' : 'Ver'} credenciales de demostración
            </button>

            {showDemoCredentials && (
              <div className="mt-4 space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Administrador</span>
                    </div>
                    <button
                      onClick={() => fillDemoCredentials('admin')}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Email: admin@contactos.com</div>
                    <div>Contraseña: admin123</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Comercial</span>
                    </div>
                    <button
                      onClick={() => fillDemoCredentials('comercial')}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Usar
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Email: marcos@contactos.com</div>
                    <div>Contraseña: marcos123</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          © 2025 Base de Contactos - Sistema de Gestión Universitaria
        </div>
      </div>
    </div>
  );
}