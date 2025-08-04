// Import UI components untuk form inputs
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Import icons untuk UI elements
import { Eye, EyeOff, UserLock } from "lucide-react";
// Import toaster untuk notifications
import { successToast, errorToast } from "../../other/toaster";
// Import helper function untuk API calls
import { fetchFromBackend } from "@/lib/helper";
// Import komponen strength meter untuk validasi password
import { PasswordStrengthMeter } from "@/components/custom/other/strength-meter";
// Import komponen tooltip untuk deskripsi
import DescriptionTooltip from "../../other/description-tooltip";

// Komponen ProfilePasswordSection untuk mengubah password user
export default function ProfilePasswordSection({
  user, // Data user yang sedang login
  showPassword, // State visibility untuk password fields
  setShowPassword, // Setter untuk toggle visibility password
  oldPassword, // State password lama untuk verifikasi
  setOldPassword, // Setter untuk update password lama
  newPassword, // State password baru
  setNewPassword, // Setter untuk update password baru
}) {
  // Handler untuk save password baru dengan validasi
  const handleSavePassword = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Validasi password lama tidak sama dengan password baru
    if (oldPassword === newPassword) {
      errorToast("Password baru tidak boleh sama dengan password lama!");
      return; // Stop execution jika validasi gagal
    }

    // Validasi panjang password minimal 8 karakter
    if (newPassword.length < 8) {
      errorToast("Password baru harus memiliki setidaknya 8 karakter!");
      return; // Stop execution jika validasi gagal
    }

    try {
      // Payload data untuk API request
      const payload = {
        oldPassword: oldPassword, // Password lama untuk verifikasi
        newPassword: newPassword, // Password baru yang akan diset
      };

      // API call untuk reset password
      const res = await fetchFromBackend("/auth/reset-password", {
        method: "PUT", // HTTP method PUT untuk update
        body: JSON.stringify(payload), // Convert payload to JSON string
      });
      const data = await res.json(); // Parse response

      if (!res.ok) {
        // Handle error dari backend
        throw new Error(data.message || "Gagal mengubah password!"); // Throw error jika response tidak ok
      } else {
        // Jika berhasil, bersihkan form dan tampilkan success message
        successToast("Berhasil mengubah password!");
        setOldPassword(""); // Clear old password field
        setNewPassword(""); // Clear new password field
      }
    } catch (error) {
      // Handle error jika ada masalah dengan network atau server
      errorToast("Gagal mengubah password!", data.message || "");
    }
  };

  return (
    <>
      {/* Section form password change */}
      <div className="space-y-4 text-muted-foreground text-sm">
        <form action="#">
          {/* Hidden email field untuk autocomplete browser (best practice security) */}
          <div className="sr-only">
            <Input
              id="email"
              type="email"
              autoComplete="email" // Browser autocomplete hint
              value={user.email} // Current user email
              readOnly // Read-only karena tidak bisa diubah
            />
          </div>

          {/* Container untuk password fields */}
          <div className="relative flex flex-col gap-3 mb-3">
            {/* Input Password Lama dengan toggle visibility */}
            <div className="relative">
              <Input
                id="old-password"
                type={showPassword ? "text" : "password"} // Toggle between text dan password type
                placeholder="Masukkan password lama" // Placeholder text
                autoComplete="old-password" // Browser autocomplete hint
                value={oldPassword} // Controlled input dengan state
                onChange={(e) => setOldPassword(e.target.value)} // Update state saat typing
                noInfo // No info icon untuk input ini
                required // Field wajib diisi
              />
              {/* Toggle button untuk show/hide password */}
              <div className="absolute inset-y-0 right-0 flex items-center cursor-pointer pr-3">
                {showPassword ? (
                  <Eye
                    className="relative h-4 w-4"
                    onClick={() => setShowPassword(false)} // Hide password
                  />
                ) : (
                  <EyeOff
                    className="relative h-4 w-4"
                    onClick={() => setShowPassword(true)} // Show password
                  />
                )}
              </div>
            </div>

            {/* Password Strength Meter untuk password baru dengan advanced features */}
            <PasswordStrengthMeter
              id="new-password"
              placeholder="Masukkan password baru" // Placeholder text
              value={newPassword} // Controlled input dengan state
              className="max-w-md" // CSS class untuk styling
              onChange={(e) => setNewPassword(e.target.value)} // Update state saat typing
              strengthLabels={{
                // Custom labels dalam bahasa Indonesia
                empty: "Kosong",
                weak: "Lemah",
                fair: "Cukup",
                good: "Bagus",
                strong: "Kuat",
              }}
              enableAutoGenerate={true} // Enable auto-generate password feature
              autoGenerateLength={10} // Panjang password yang di-generate
              autoComplete="new-password" // Browser autocomplete hint
              required // Field wajib diisi
            />
          </div>
        </form>

        {/* Button untuk save password changes */}

        <Button
          variant="outline" // Button style variant
          onClick={handleSavePassword} // Handler untuk save password
          className="w-full cursor-pointer transition-all duration-500"
        >
          Simpan Perubahan {/* Button text */}
          <UserLock className="h-5 w-5" /> {/* Icon lock */}
        </Button>
      </div>
    </>
  );
}
