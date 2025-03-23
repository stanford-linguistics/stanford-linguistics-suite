import { useState, useCallback, useMemo } from 'react';
import { filterData } from '../utils/dataProcessing';
import { POS_CATEGORIES } from '../constants/chartConfig';

/**
 * Custom hook for managing data filtering in the ResultsGraph
 * 
 * @param {Array} data - The data to filter
 * @returns {Object} Filtering state and methods
 */
export const useFiltering = (data) => {
  const [posFilter, setPosFilter] = useState('all');
  const [stressFilter, setStressFilter] = useState('all');
  const [syllableFilter, setSyllableFilter] = useState('all');
  const [colorScheme, setColorScheme] = useState('none');
  const [showFilters, setShowFilters] = useState(false);
  
  const filteredData = useMemo(() => {
    return filterData(
      data,
      posFilter,
      stressFilter,
      syllableFilter,
      POS_CATEGORIES
    );
  }, [data, posFilter, stressFilter, syllableFilter]);
  
  const handlePosFilterChange = useCallback((e) => {
    setPosFilter(e.target.value);
  }, []);
  
  const handleStressFilterChange = useCallback((e) => {
    setStressFilter(e.target.value);
  }, []);
  
  const handleSyllableFilterChange = useCallback((e) => {
    setSyllableFilter(e.target.value);
  }, []);
  
  const handleColorSchemeChange = useCallback((e) => {
    setColorScheme(e.target.value);
  }, []);
  
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);
  
  const resetFilters = useCallback(() => {
    setPosFilter('all');
    setStressFilter('all');
    setSyllableFilter('all');
    setColorScheme('none');
  }, []);
  
  const filterOptions = useMemo(() => {
    return {
      pos: [
        { value: 'all', label: 'All Parts of Speech' },
        ...Object.keys(POS_CATEGORIES).map(cat => ({ value: cat, label: cat })),
        { value: 'other', label: 'Other' }
      ],
      stress: [
        { value: 'all', label: 'All Stress Patterns' },
        { value: 'yes', label: 'Stressed' },
        { value: 'no', label: 'Unstressed' },
        { value: 'ambig', label: 'Ambiguous' }
      ],
      syllable: [
        { value: 'all', label: 'All Syllable Counts' },
        { value: '1', label: 'Monosyllabic' },
        { value: '2', label: 'Disyllabic' },
        { value: '3+', label: '3+ Syllables' }
      ],
      colorScheme: [
        { value: 'none', label: 'Default Colors' },
        { value: 'pos', label: 'Color by POS' },
        { value: 'stress', label: 'Color by Stress' }
      ]
    };
  }, []);
  
  const hasActiveFilters = useMemo(() => {
    return posFilter !== 'all' || 
           stressFilter !== 'all' || 
           syllableFilter !== 'all';
  }, [posFilter, stressFilter, syllableFilter]);
  
  return {
    // States
    posFilter,
    stressFilter,
    syllableFilter,
    colorScheme,
    showFilters,
    filteredData,
    filterOptions,
    hasActiveFilters,
    
    // Actions
    setPosFilter,
    setStressFilter,
    setSyllableFilter,
    setColorScheme,
    handlePosFilterChange,
    handleStressFilterChange,
    handleSyllableFilterChange,
    handleColorSchemeChange,
    toggleFilters,
    resetFilters
  };
};

export default useFiltering;
