// Hook untuk mendeteksi klik di luar elemen - berguna untuk menutup dropdown/modal saat klik di luar
// Mendukung event mouse dan sentuh untuk kompatibilitas perangkat mobile
import { useEffect } from 'react';

function useClickOutside(ref, handler) {
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kembalikan lebih awal jika ref tidak ada atau klik masih di dalam elemen
      if (!ref || !ref.current || ref.current.contains(event.target)) {
        return;
      }

      // Jalankan handler jika klik di luar elemen
      handler(event);
    };

    // Pasang listener untuk event mouse dan sentuh
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside); // Dukungan untuk mobile

    // Bersihkan listener saat komponen dilepas (unmount)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler]);
}

export default useClickOutside;
