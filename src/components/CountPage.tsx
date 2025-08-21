import React, { useState, useMemo } from 'react';
import { BarChart3, Users, Filter, ArrowRight } from 'lucide-react';
import { Contact, UniversityStats, TitulationStats } from '../types';
import { getUniversities, getTitulacionesByUniversidad } from '../data/universitiesData';
import { getSchoolsForUniversity, getTitulationsForSchool, getSchoolForTitulation } from '../data/schoolsData';

interface CountPageProps {
  contacts: Contact[];
  onNavigateToContacts: (filters: any) => void;
}

export default function CountPage({ contacts, onNavigateToContacts }: CountPageProps) {
  const [selectedUniversidad, setSelectedUniversidad] = useState<string>('');
  const [selectedCurso, setSelectedCurso] = useState<string>('');

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesUniversidad = !selectedUniversidad || contact.universidad === selectedUniversidad;
      const matchesCurso = !selectedCurso || contact.curso?.toString() === selectedCurso;
      return matchesUniversidad && matchesCurso;
    });
  }, [contacts, selectedUniversidad, selectedCurso]);

  const universityStats = useMemo(() => {
    const stats: Record<string, UniversityStats> = {};
    
    filteredContacts.forEach(contact => {
      if (!stats[contact.universidad]) {
        stats[contact.universidad] = {
          universidad: contact.universidad,
          total: 0,
          titulaciones: []
        };
      }
      stats[contact.universidad].total++;
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredContacts]);

  const titulationStats = useMemo(() => {
    const universities = getUniversities();
    const allTitulationStats: (TitulationStats & { school?: string; porComercial?: Record<string, number> })[] = [];
    
    // Crear estadísticas para todas las titulaciones agrupadas por escuela
    universities.forEach(universidad => {
      const schools = getSchoolsForUniversity(universidad);
      
      schools.forEach(school => {
        const titulaciones = getTitulationsForSchool(universidad, school);
        
        titulaciones.forEach(titulacion => {
          const contactsForTitulation = filteredContacts.filter(contact => 
            contact.universidad === universidad && contact.titulacion === titulacion
          );
          
          const porCurso: Record<number, number> = {};
          const porComercial: Record<string, number> = {};
          
          contactsForTitulation.forEach(contact => {
            if (contact.curso) {
              porCurso[contact.curso] = (porCurso[contact.curso] || 0) + 1;
            }
            
            // Contar por comercial
            const comercialNombre = contact.comercial_nombre || 'Sin asignar';
            porComercial[comercialNombre] = (porComercial[comercialNombre] || 0) + 1;
          });
          
          allTitulationStats.push({
            titulacion,
            universidad,
            total: contactsForTitulation.length,
            porCurso,
            porComercial,
            school
          });
        });
      });
    });

    return allTitulationStats;
  }, [filteredContacts]);

  const totalContacts = filteredContacts.length;
  const uniqueUniversidades = [...new Set(contacts.map(c => c.universidad))];

  const handleUniversityClick = (universidad: string) => {
    onNavigateToContacts({
      universidad,
      titulacion: '',
      curso: selectedCurso,
      aportado_por: '',
      consentimiento: '',
      search: ''
    });
  };

  const handleTitulationClick = (universidad: string, titulacion: string) => {
    onNavigateToContacts({
      universidad,
      titulacion,
      curso: selectedCurso,
      aportado_por: '',
      consentimiento: '',
      search: ''
    });
  };

  const scrollToUniversitySection = (universidad: string) => {
    // Create a unique ID for the university section
    const sectionId = `university-section-${universidad.toLowerCase().replace(/\s+/g, '-')}`;
    const targetElement = document.getElementById(sectionId);
    
    if (targetElement) {
      // Smooth scroll to the target section
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      // Optional: Add a small offset to account for any fixed headers
      setTimeout(() => {
        const yOffset = -20; // Adjust this value as needed
        const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleUniversityCardClick = (universidad: string) => {
    // First scroll to the section
    scrollToUniversitySection(universidad);
    
    // Optional: Also navigate to contacts if needed
    // handleUniversityClick(universidad);
  };
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conteo y Estadísticas</h1>
          <p className="text-gray-600">Resumen de contactos por universidad y titulación</p>
        </div>
      </div>

      {/* Filtros de contexto */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filtros de Contexto</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <select
              value={selectedUniversidad}
              onChange={(e) => setSelectedUniversidad(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las universidades</option>
              {uniqueUniversidades.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso
            </label>
            <select
              value={selectedCurso}
              onChange={(e) => setSelectedCurso(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los cursos</option>
              {[1, 2, 3, 4, 5, 6].map(curso => (
                <option key={curso} value={curso.toString()}>{curso}º</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">Total de Contactos</h3>
            <p className="text-3xl font-bold">{totalContacts}</p>
          </div>
          <Users className="w-12 h-12 opacity-75" />
        </div>
      </div>

      {/* Contactos por Universidad */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contactos por Universidad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {universityStats.map(stat => {
            const percentage = totalContacts > 0 ? ((stat.total / totalContacts) * 100).toFixed(1) : '0';
            return (
              <div
                key={stat.universidad}
                onClick={() => handleUniversityCardClick(stat.universidad)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{stat.universidad}</h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-blue-600 mb-1">{stat.total}</p>
                <p className="text-sm text-gray-500">{percentage}% del total</p>
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contactos por Titulación */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Contactos por Titulación (Agrupado por Universidad)
          {selectedUniversidad && (
            <span className="text-blue-600 font-normal"> - {selectedUniversidad}</span>
          )}
        </h2>
        
        <div className="space-y-6">
          {getUniversities().sort().map(universidad => {
            const universityTitulations = titulationStats.filter(stat => stat.universidad === universidad);
            const universityTotal = universityTitulations.reduce((sum, stat) => sum + stat.total, 0);
            const schools = getSchoolsForUniversity(universidad);
            
            return (
              <div 
                key={universidad} 
                id={`university-section-${universidad.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden scroll-mt-6"
              >
                {/* Header de Universidad */}
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{universidad}</h3>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-blue-100">
                        {universityTitulations.length} titulaciones
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white">
                        {universityTotal} contactos
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Tabla de Titulaciones */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schools.map(school => {
                        const schoolTitulations = universityTitulations
                          .filter(stat => stat.school === school)
                          .sort((a, b) => {
                            // Ordenar por total de contactos (descendente), luego alfabéticamente
                            if (a.total !== b.total) {
                              return b.total - a.total;
                            }
                            return a.titulacion.localeCompare(b.titulacion);
                          });
                        
                        const schoolTotal = schoolTitulations.reduce((sum, stat) => sum + stat.total, 0);
                        
                        return (
                          <React.Fragment key={`${universidad}-${school}`}>
                            {/* Fila separadora de escuela */}
                            <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                              <td colSpan={5} className="px-6 py-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                                    {school}
                                  </h4>
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                                    {schoolTotal} contactos
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Header de columnas para esta escuela */}
                            <tr className="bg-gray-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Titulación
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Por Curso
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Comerciales
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                            
                            {/* Titulaciones de esta escuela */}
                            {schoolTitulations.map((stat, index) => (
                              <tr 
                                key={`${stat.universidad}-${stat.titulacion}`}
                                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {stat.titulacion}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    stat.total > 0 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {stat.total}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex flex-wrap gap-1">
                                    {[1, 2, 3, 4, 5, 6].map(curso => {
                                      const count = stat.porCurso[curso] || 0;
                                      return (
                                        <span
                                          key={curso}
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                            count > 0
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-gray-100 text-gray-400'
                                          }`}
                                        >
                                          {curso}º: {count}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex flex-wrap gap-1">
                                    {stat.porComercial && Object.entries(stat.porComercial)
                                      .sort(([,a], [,b]) => b - a) // Ordenar por cantidad descendente
                                      .map(([comercial, count]) => (
                                        <span
                                          key={comercial}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                          title={`${comercial}: ${count} contactos`}
                                        >
                                          {comercial}: {count}
                                        </span>
                                      ))
                                    }
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    onClick={() => handleTitulationClick(stat.universidad, stat.titulacion)}
                                    className={`flex items-center ${
                                      stat.total > 0 
                                        ? 'text-blue-600 hover:text-blue-700' 
                                        : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={stat.total === 0}
                                  >
                                    {stat.total > 0 ? 'Ver contactos' : 'Sin contactos'}
                                    {stat.total > 0 && <ArrowRight className="w-3 h-3 ml-1" />}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {titulationStats.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay datos para mostrar con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}