import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, X, Upload, Download, FileText } from 'lucide-react';
import { Contact, ContactFilters } from '../types';
import ContactForm from './ContactForm';
import ContactDetail from './ContactDetail';
import { getUniversities, getTitulacionesByUniversidad } from '../data/universitiesData';
import { User } from '../types/auth';

interface ContactsPageProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onUpdateContact: (id: string, contact: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onDeleteContact: (id: string) => void;
  initialFilters?: Partial<ContactFilters>;
  currentUser: User | null;
  hasPermission: (action: 'view' | 'edit', contactOwnerId?: string) => boolean;
}

export default function ContactsPage({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  initialFilters = {},
  currentUser,
  hasPermission
}: ContactsPageProps) {
  const [filters, setFilters] = useState<ContactFilters>({
    universidad: initialFilters.universidad || '',
    titulacion: initialFilters.titulacion || '',
    curso: initialFilters.curso || '',
    search: initialFilters.search || ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const contactsPerPage = 10;

  const universities = getUniversities();
  const availableTitulaciones = filters.universidad 
    ? getTitulacionesByUniversidad(filters.universidad)
    : [...new Set(contacts.map(c => c.titulacion))];

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = filters.search === '' || 
        contact.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        (contact.telefono && contact.telefono.includes(filters.search));
      
      const matchesUniversidad = filters.universidad === '' || contact.universidad === filters.universidad;
      const matchesTitulacion = filters.titulacion === '' || contact.titulacion === filters.titulacion;
      const matchesCurso = filters.curso === '' || contact.curso?.toString() === filters.curso;
      
      return matchesSearch && matchesUniversidad && matchesTitulacion && matchesCurso;
    });
  }, [contacts, filters]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * contactsPerPage;
    return filteredContacts.slice(startIndex, startIndex + contactsPerPage);
  }, [filteredContacts, currentPage]);

  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);

  const handleFilterChange = (key: keyof ContactFilters, value: string) => {
    if (key === 'universidad') {
      // Reset titulación cuando cambia la universidad
      setFilters(prev => ({ ...prev, [key]: value, titulacion: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      universidad: '',
      titulacion: '',
      curso: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormSubmit = (contactData: Omit<Contact, 'id' | 'fecha_alta'>) => {
    console.log('📋 ContactsPage: Handling form submit');
    if (editingContact) {
      console.log('✏️ Updating existing contact:', editingContact.id);
      onUpdateContact(editingContact.id, contactData);
    } else {
      console.log('➕ Adding new contact');
      onAddContact(contactData as any, currentUser);
    }
    setShowForm(false);
    setEditingContact(null);
    console.log('✅ Form submission completed');
  };

  // Nuevas funciones para manejar selección
  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(paginatedContacts.map(contact => contact.id)));
    }
  };

  // Función para importar Excel
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Aquí implementarías la lógica para leer el archivo Excel
      // Por ahora, solo mostramos un mensaje
      console.log('Importando archivo Excel:', file.name);
      alert('Funcionalidad de importar Excel en desarrollo');
    }
  };

  // Función para exportar PDF
  const handleExportPDF = () => {
    const selectedContactsData = contacts.filter(contact => selectedContacts.has(contact.id));
    if (selectedContactsData.length === 0) {
      alert('Por favor, selecciona al menos un contacto para exportar');
      return;
    }
    // Aquí implementarías la lógica para generar el PDF
    console.log('Exportando contactos a PDF:', selectedContactsData);
    alert(`Exportando ${selectedContactsData.length} contactos a PDF (funcionalidad en desarrollo)`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
          <p className="text-gray-600">{filteredContacts.length} contactos encontrados</p>
          {selectedContacts.size > 0 && (
            <p className="text-blue-600 text-sm">{selectedContacts.size} contactos seleccionados</p>
          )}
        </div>
        <div className="flex space-x-3">
          {/* Botón de exportar PDF */}
          {selectedContacts.size > 0 && (
            <button
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF ({selectedContacts.size})
            </button>
          )}
          
          {/* Botón de importar Excel */}
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
          
          {/* Botón de añadir contacto */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir Contacto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <select
              value={filters.universidad}
              onChange={(e) => handleFilterChange('universidad', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Todas</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulación
            </label>
            <select
              value={filters.titulacion}
              onChange={(e) => handleFilterChange('titulacion', e.target.value)}
              disabled={!filters.universidad}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                !filters.universidad ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option value="">
                {!filters.universidad ? 'Primero selecciona universidad' : 'Todas'}
              </option>
              {availableTitulaciones.map(tit => (
                <option key={tit} value={tit}>{tit}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso
            </label>
            <select
              value={filters.curso}
              onChange={(e) => handleFilterChange('curso', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5, 6].map(curso => (
                <option key={curso} value={curso.toString()}>{curso}º</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla de contactos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Universidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titulación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Año Nacimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Alta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedContacts.map((contact, index) => (
                <tr 
                  key={contact.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedContacts.has(contact.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contact.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.telefono || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.universidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.titulacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.curso ? `${contact.curso}º` : 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.año_nacimiento || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.comercial_nombre || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.fecha_alta).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingContact(contact)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-green-600 hover:text-green-700"
                        disabled={!hasPermission('edit', contact.comercial_id)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteContact(contact.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={!hasPermission('edit', contact.comercial_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">{(currentPage - 1) * contactsPerPage + 1}</span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * contactsPerPage, filteredContacts.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{filteredContacts.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ContactForm
          contact={editingContact}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingContact(null);
          }}
        />
      )}

      {viewingContact && (
        <ContactDetail
          contact={viewingContact}
          onClose={() => setViewingContact(null)}
          onEdit={() => {
            setEditingContact(viewingContact);
            setShowForm(true);
            setViewingContact(null);
          }}
        />
      )}
    </div>
  );
}