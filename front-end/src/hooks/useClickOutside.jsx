// Hook untuk detect clicks outside element - berguna untuk close dropdown/modal saat click luar
// Supports both mouse dan touch events untuk mobile compatibility
import { useEffect } from 'react';

function useClickOutside(ref, handler) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Return early jika ref tidak ada atau click masih di dalam element
      if (!ref || !ref.current || ref.current.contains(event.target)) {
        return;
      }

      // Execute handler jika click di luar element
      handler(event);
    };

    // Listen untuk mouse dan touch events
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Mobile support

    // Cleanup listeners saat component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler]);
}

export default useClickOutside;
