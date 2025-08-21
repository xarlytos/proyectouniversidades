import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Contact } from '../types';
import { getUniversities, getTitulacionesByUniversidad } from '../data/universitiesData';

interface ContactFormProps {
  contact?: Contact | null;
  onSubmit: (contact: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState({
    universidad: '',
    titulacion: '',
    nombre: '',
    curso: null as number | null,
    telefono: '',
    año_nacimiento: null as number | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTitulaciones, setAvailableTitulaciones] = useState<string[]>([]);

  const universities = getUniversities();

  useEffect(() => {
    if (contact) {
      setFormData({
        universidad: contact.universidad,
        titulacion: contact.titulacion,
        nombre: contact.nombre,
        curso: contact.curso,
        telefono: contact.telefono || '',
        año_nacimiento: contact.año_nacimiento || null
      });
      
      // Cargar titulaciones para la universidad del contacto
      if (contact.universidad) {
        setAvailableTitulaciones(getTitulacionesByUniversidad(contact.universidad));
      }
    }
  }, [contact]);

  const handleUniversidadChange = (universidad: string) => {
    setFormData(prev => ({
      ...prev,
      universidad,
      titulacion: '' // Reset titulación cuando cambia la universidad
    }));
    
    // Actualizar titulaciones disponibles
    if (universidad) {
      setAvailableTitulaciones(getTitulacionesByUniversidad(universidad));
    } else {
      setAvailableTitulaciones([]);
    }
    
    // Limpiar error de universidad si existe
    if (errors.universidad) {
      setErrors(prev => ({ ...prev, universidad: '' }));
    }
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Es opcional
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,15}$/;
    return phoneRegex.test(phone);
  };

  const validateBirthYear = (year: number | null) => {
    if (year === null) return true; // Es opcional
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Campos obligatorios
    if (!formData.universidad.trim()) {
      newErrors.universidad = 'La universidad es requerida';
    }

    if (!formData.titulacion.trim()) {
      newErrors.titulacion = 'La titulación es requerida';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (formData.curso === null || formData.curso < 1 || formData.curso > 6) {
      newErrors.curso = 'El curso es requerido y debe estar entre 1 y 6';
    }

    // Campos opcionales con validación
    if (formData.telefono && !validatePhone(formData.telefono)) {
      newErrors.telefono = 'El formato del teléfono no es válido';
    }

    if (formData.año_nacimiento && !validateBirthYear(formData.año_nacimiento)) {
      newErrors.año_nacimiento = 'El año de nacimiento debe estar entre 1900 y el año actual';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        universidad: formData.universidad,
        titulacion: formData.titulacion,
        nombre: formData.nombre,
        curso: formData.curso,
        telefono: formData.telefono || undefined,
        año_nacimiento: formData.año_nacimiento || undefined
      };
      
      console.log('📝 Submitting contact form:', submitData);
      const result = onSubmit(submitData);
      console.log('✅ Contact form submitted successfully:', result);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Universidad - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad *
            </label>
            <select
              value={formData.universidad}
              onChange={(e) => handleUniversidadChange(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.universidad ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona una universidad</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
            {errors.universidad && (
              <p className="text-red-500 text-sm mt-1">{errors.universidad}</p>
            )}
          </div>

          {/* 2. Titulación - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulación *
            </label>
            <select
              value={formData.titulacion}
              onChange={(e) => handleChange('titulacion', e.target.value)}
              disabled={!formData.universidad}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.titulacion ? 'border-red-300' : 'border-gray-300'
              } ${!formData.universidad ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {!formData.universidad ? 'Primero selecciona una universidad' : 'Selecciona una titulación'}
              </option>
              {availableTitulaciones.map(tit => (
                <option key={tit} value={tit}>{tit}</option>
              ))}
            </select>
            {errors.titulacion && (
              <p className="text-red-500 text-sm mt-1">{errors.titulacion}</p>
            )}
          </div>

          {/* 3. Nombre - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.nombre ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nombre completo del estudiante"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* 4. Curso - Obligatorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso *
            </label>
            <select
              value={formData.curso || ''}
              onChange={(e) => handleChange('curso', e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.curso ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona el curso</option>
              {[1, 2, 3, 4, 5, 6].map(curso => (
                <option key={curso} value={curso}>{curso}º</option>
              ))}
            </select>
            {errors.curso && (
              <p className="text-red-500 text-sm mt-1">{errors.curso}</p>
            )}
          </div>

          {/* 5. Número de teléfono - Opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de teléfono <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.telefono ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 666 123 456"
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
            )}
          </div>

          {/* 6. Año de nacimiento - Opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año de nacimiento <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.año_nacimiento || ''}
              onChange={(e) => handleChange('año_nacimiento', e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.año_nacimiento ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: 1995"
            />
            {errors.año_nacimiento && (
              <p className="text-red-500 text-sm mt-1">{errors.año_nacimiento}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {contact ? 'Actualizar' : 'Crear'} Contacto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}