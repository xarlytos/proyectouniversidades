import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, Check, Edit2, Trash2 } from 'lucide-react';
import { Contact } from '../types';
import { getUniversidades, getTitulacionesByUniversidad } from '../data/universitiesData';
import { useContacts } from '../hooks/useContacts';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: Omit<Contact, 'id' | 'fecha_alta'>[]) => void;
  existingContacts: Contact[];
}

interface ExcelRow {
  [key: string]: any;
}

interface MappedContact {
  rowIndex: number;
  data: Partial<Contact>;
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
  duplicateFields: string[];
}

interface ColumnMapping {
  [excelColumn: string]: keyof Contact | '';
}

const CONTACT_FIELDS = {
  nombre: 'Nombre',
  telefono: 'Teléfono',
  instagram: 'Instagram',
  universidad: 'Universidad',
  titulacion: 'Titulación',
  curso: 'Curso',
  año_nacimiento: 'Año de Nacimiento',
  comercial: 'Comercial'
};

export default function ExcelImportModal({ isOpen, onClose, onImport, existingContacts }: ExcelImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'validation'>('upload');
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mappedContacts, setMappedContacts] = useState<MappedContact[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkDuplicates } = useContacts();

  const resetModal = () => {
    setStep('upload');
    setExcelData([]);
    setExcelColumns([]);
    setColumnMapping({});
    setMappedContacts([]);
    setFileName('');
    setIsProcessing(false);
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    // En la función handleFileUpload, reemplaza la simulación con:
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const columns = Object.keys(jsonData[0] || {});
        setExcelData(jsonData);
        setExcelColumns(columns);
        setStep('preview');
      } catch (error) {
        alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleColumnMapping = (excelColumn: string, contactField: keyof Contact | '') => {
    setColumnMapping(prev => ({
      ...prev,
      [excelColumn]: contactField
    }));
  };

  const validateAndMapContacts = () => {
    const mapped: MappedContact[] = [];
    
    excelData.forEach((row, index) => {
      const contactData: Partial<Contact> = {};
      const errors: string[] = [];
      let isDuplicate = false;
      const duplicateFields: string[] = [];

      // Mapear datos según el mapping de columnas
      Object.entries(columnMapping).forEach(([excelCol, contactField]) => {
        if (contactField && row[excelCol] !== undefined) {
          const value = row[excelCol];
          
          switch (contactField) {
            case 'curso':
            case 'año_nacimiento':
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                contactData[contactField] = numValue;
              }
              break;
            case 'telefono':
              contactData[contactField] = value?.toString().trim();
              break;
            case 'instagram':
              let instagram = value?.toString().trim();
              if (instagram && !instagram.startsWith('@')) {
                instagram = instagram.replace(/^@/, '');
              }
              contactData[contactField] = instagram;
              break;
            default:
              contactData[contactField] = value?.toString().trim();
          }
        }
      });

      // Validaciones obligatorias
      if (!contactData.nombre) {
        errors.push('El nombre es obligatorio');
      }
      if (!contactData.universidad) {
        errors.push('La universidad es obligatoria');
      }
      if (!contactData.titulacion) {
        errors.push('La titulación es obligatoria');
      }
      if (!contactData.telefono && !contactData.instagram) {
        errors.push('Se requiere al menos teléfono o Instagram');
      }

      // Verificar duplicados
      if (contactData.telefono) {
        const phoneExists = existingContacts.some(c => c.telefono === contactData.telefono) ||
                           mapped.some(m => m.data.telefono === contactData.telefono);
        if (phoneExists) {
          isDuplicate = true;
          duplicateFields.push('telefono');
          errors.push('El teléfono ya está registrado');
        }
      }

      if (contactData.instagram) {
        const instagramExists = existingContacts.some(c => c.instagram === contactData.instagram) ||
                               mapped.some(m => m.data.instagram === contactData.instagram);
        if (instagramExists) {
          isDuplicate = true;
          duplicateFields.push('instagram');
          errors.push('El Instagram ya está registrado');
        }
      }

      mapped.push({
        rowIndex: index,
        data: contactData,
        errors,
        isValid: errors.length === 0,
        isDuplicate,
        duplicateFields
      });
    });

    setMappedContacts(mapped);
    setStep('validation');
  };

  const handleEditContact = (index: number, field: keyof Contact, value: any) => {
    setMappedContacts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        data: {
          ...updated[index].data,
          [field]: value
        }
      };
      
      // Re-validar la fila editada
      const contact = updated[index];
      const errors: string[] = [];
      let isDuplicate = false;
      const duplicateFields: string[] = [];

      // Validaciones básicas
      if (!contact.data.nombre) errors.push('El nombre es obligatorio');
      if (!contact.data.universidad) errors.push('La universidad es obligatoria');
      if (!contact.data.titulacion) errors.push('La titulación es obligatoria');
      if (!contact.data.telefono && !contact.data.instagram) {
        errors.push('Se requiere al menos teléfono o Instagram');
      }

      // Verificar duplicados
      if (contact.data.telefono) {
        const phoneExists = existingContacts.some(c => c.telefono === contact.data.telefono) ||
                           updated.some((m, i) => i !== index && m.data.telefono === contact.data.telefono);
        if (phoneExists) {
          isDuplicate = true;
          duplicateFields.push('telefono');
          errors.push('El teléfono ya está registrado');
        }
      }

      if (contact.data.instagram) {
        const instagramExists = existingContacts.some(c => c.instagram === contact.data.instagram) ||
                               updated.some((m, i) => i !== index && m.data.instagram === contact.data.instagram);
        if (instagramExists) {
          isDuplicate = true;
          duplicateFields.push('instagram');
          errors.push('El Instagram ya está registrado');
        }
      }

      updated[index] = {
        ...updated[index],
        errors,
        isValid: errors.length === 0,
        isDuplicate,
        duplicateFields
      };

      return updated;
    });
  };

  const handleRemoveContact = (index: number) => {
    setMappedContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    const validContacts = mappedContacts
      .filter(contact => contact.isValid)
      .map(contact => contact.data as Omit<Contact, 'id' | 'fecha_alta'>);
    
    onImport(validContacts);
    resetModal();
    onClose();
  };

  const hasErrors = mappedContacts.some(contact => !contact.isValid);
  const validContactsCount = mappedContacts.filter(contact => contact.isValid).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Importar Contactos desde Excel
          </h2>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecciona un archivo Excel
                </h3>
                <p className="text-gray-500 mb-6">
                  Sube un archivo .xlsx o .xls con los datos de contactos
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Seleccionar Archivo
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Vista previa del archivo: {fileName}
                </h3>
                <p className="text-gray-500">
                  Se encontraron {excelData.length} filas de datos
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {excelColumns.map((column) => (
                          <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {excelData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {excelColumns.map((column) => (
                            <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row[column]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {excelData.length > 5 && (
                  <div className="bg-gray-50 px-6 py-3 text-sm text-gray-500">
                    ... y {excelData.length - 5} filas más
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cambiar Archivo
                </button>
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Column Mapping */}
          {step === 'mapping' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Asignación de Columnas
                </h3>
                <p className="text-gray-500">
                  Mapea las columnas del Excel a los campos de contacto
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {excelColumns.map((column) => (
                  <div key={column} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        {column}
                      </label>
                      <div className="text-xs text-gray-500">
                        Ejemplo: {excelData[0]?.[column]}
                      </div>
                    </div>
                    <div className="w-8 text-center text-gray-400">→</div>
                    <div className="w-1/3">
                      <select
                        value={columnMapping[column] || ''}
                        onChange={(e) => handleColumnMapping(column, e.target.value as keyof Contact)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- No mapear --</option>
                        {Object.entries(CONTACT_FIELDS).map(([field, label]) => (
                          <option key={field} value={field}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('preview')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={validateAndMapContacts}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Validar Datos
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Validation */}
          {step === 'validation' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Validación de Datos
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600">
                    <Check className="w-4 h-4 inline mr-1" />
                    {validContactsCount} válidos
                  </span>
                  {hasErrors && (
                    <span className="text-red-600">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      {mappedContacts.length - validContactsCount} con errores
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {mappedContacts.map((contact, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      contact.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          Fila {contact.rowIndex + 1}
                        </span>
                        {contact.isValid ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveContact(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={contact.data.nombre || ''}
                          onChange={(e) => handleEditContact(index, 'nombre', e.target.value)}
                          className={`w-full text-sm border rounded px-2 py-1 ${
                            contact.duplicateFields.includes('nombre') ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={contact.data.telefono || ''}
                          onChange={(e) => handleEditContact(index, 'telefono', e.target.value)}
                          className={`w-full text-sm border rounded px-2 py-1 ${
                            contact.duplicateFields.includes('telefono') ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Instagram
                        </label>
                        <input
                          type="text"
                          value={contact.data.instagram || ''}
                          onChange={(e) => handleEditContact(index, 'instagram', e.target.value)}
                          className={`w-full text-sm border rounded px-2 py-1 ${
                            contact.duplicateFields.includes('instagram') ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    {contact.errors.length > 0 && (
                      <div className="text-xs text-red-600">
                        <ul className="list-disc list-inside">
                          {contact.errors.map((error, errorIndex) => (
                            <li key={errorIndex}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={hasErrors || validContactsCount === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Importar {validContactsCount} Contactos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}