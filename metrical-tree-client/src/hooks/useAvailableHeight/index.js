import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate available height for content
 * Accounts for fixed headers and footers
 */
const useAvailableHeight = () => {
  const [availableHeight, setAvailableHeight] = useState(0);
  
  useEffect(() => {
    const calculateHeight = () => {
      const headerHeight = 90; // IdentityBar + Appbar
      const footerHeight = 230; // SecondaryFooter + PrimaryFooter
      return window.innerHeight - (headerHeight + footerHeight);
    };
    
    const handleResize = () => {
      setAvailableHeight(calculateHeight());
    };
    
    // Initial calculation
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return availableHeight;
};

export default useAvailableHeight;
