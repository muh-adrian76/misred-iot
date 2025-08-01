// Import komponen UI untuk badge dan avatar
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// Import ikon-ikon dari Lucide React untuk UI
import { 
  Users, 
  Crown, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2
} from "lucide-react";

// Komponen Avatar User - menampilkan avatar pengguna dengan inisial nama
function UserAvatar({ user }) {
  return (
    // Avatar dengan ukuran 10x10, disembunyikan di layar kecil
    <Avatar className="h-10 w-10 hidden sm:block">
      {/* Fallback avatar dengan background primary dan teks inisial */}
      <AvatarFallback className="bg-primary/10 text-primary">
        {/* Ambil karakter pertama dari nama user, atau 'U' jika tidak ada */}
        {user.name?.charAt(0) || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}

// Komponen Badge Status - menampilkan status onboarding dan notifikasi WhatsApp
function StatusBadge({ user }) {
  return (
    // Container untuk badge dengan gap vertikal
    <div className="flex flex-col gap-1">
      {/* Badge status penyelesaian onboarding */}
      <Badge 
        key="onboarding"
        // Variant berdasarkan status onboarding (default jika selesai, secondary jika belum)
        variant={user.onboarding_completed ? "default" : "secondary"}
        className="text-xs"
      >
        {/* Tampilkan ikon dan teks berdasarkan status onboarding */}
        {user.onboarding_completed ? (
          <>
            <UserCheck className="w-3 h-3 mr-1" />
            Sudah menyelesaikan panduan
          </>
        ) : (
          <>
            <UserX className="w-3 h-3 mr-1" />
            Belum menyelesaikan panduan
          </>
        )}
      </Badge>
      {/* Badge status notifikasi WhatsApp */}
      <Badge 
        key="whatsapp"
        // Variant berdasarkan status WhatsApp (outline jika aktif, secondary jika nonaktif)
        variant={user.whatsapp_notif ? "outline" : "secondary"}
        className="text-xs"
      >
        {/* Tampilkan status WhatsApp */}
        WhatsApp: {user.whatsapp_notif ? 'Aktif' : 'Nonaktif'}
      </Badge>
    </div>
  );
}

// Komponen Badge Role - menampilkan peran pengguna (Admin atau User)
function RoleBadge({ user }) {
  return (
    <Badge 
      // Variant berdasarkan role (default untuk admin, secondary untuk user)
      variant={user.is_admin ? "default" : "secondary"}
      // Styling khusus untuk admin dengan warna purple
      className={user.is_admin ? "bg-purple-100 text-purple-800 hover:bg-purple-200" : ""}
    >
      {/* Tampilkan ikon dan teks berdasarkan role */}
      {user.is_admin ? (
        <>
          <Crown className="w-3 h-3 mr-1" />
          Admin
        </>
      ) : (
        <>
          <Users className="w-3 h-3 mr-1" />
          User
        </>
      )}
    </Badge>
  );
}

// Definisi Kolom Tabel - fungsi untuk menerima handler edit dan delete
// Definisi Kolom Tabel - fungsi untuk menerima handler edit dan delete
export const createUserColumns = (onEdit, onDelete) => [
  {
    // Kolom informasi user (avatar, nama, email)
    key: "user",
    label: "User",
    sortable: true, // Dapat diurutkan
    filterable: false, // Tidak dapat difilter
    render: (user) => (
      // Container untuk avatar dan info user
      <div className="flex items-center space-x-3">
        {/* Komponen avatar user */}
        <UserAvatar user={user} />
        {/* Info nama dan email */}
        <div className="flex flex-col items-start">
          <div className="font-medium text-sm">
            {/* Nama user atau fallback */}
            {user.name || 'Unknown User'}
          </div>
          <div className="text-sm text-muted-foreground">
            {/* Email user */}
            {user.email}
          </div>
        </div>
      </div>
    ),
  },
  {
    // Kolom nomor telepon
    key: "phone",
    label: "Nomor Telepon",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="text-sm">
        {/* Nomor telepon atau tanda strip jika kosong */}
        {user.phone || '-'}
      </div>
    ),
  },
  {
    // Kolom status onboarding dan notifikasi
    key: "status",
    label: "Status & Notifikasi",
    sortable: false,
    filterable: true, // Dapat difilter
    // Opsi filter untuk status
    filterOptions: ["completed", "not_completed", "whatsapp_enabled", "whatsapp_disabled"],
    render: (user) => <StatusBadge user={user} />,
  },
  {
    // Kolom role pengguna
    key: "role",
    label: "Role",
    sortable: true,
    filterable: true,
    // Opsi filter untuk role
    filterOptions: ["admin", "user"],
    render: (user) => <RoleBadge user={user} />,
  },
  {
    // Kolom waktu login terakhir
    key: "last_login",
    label: "Terakhir Login",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="text-sm">
        {/* Format tanggal login terakhir dalam bahasa Indonesia */}
        {user.last_login ? new Date(user.last_login).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Belum pernah'}
      </div>
    ),
  },
  {
    // Kolom tanggal pendaftaran
    key: "created_at",
    label: "Tanggal Daftar",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="text-sm">
        {/* Format tanggal pendaftaran dalam bahasa Indonesia */}
        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : 'Unknown'}
      </div>
    ),
  },
];

// Aksi Baris (Row Actions) - seperti yang digunakan di device-content.jsx
export const createUserRowActions = (openEditDialog, openDeleteDialog) => [
  {
    // Aksi edit user
    key: "edit",
    label: "Edit User",
    icon: Edit, // Ikon edit dari Lucide
    className: "hover:text-foreground", // Styling hover
    disabled: false, // Tidak di-disable
    onClick: (user) => {
      // Callback untuk membuka dialog edit
      openEditDialog(user);
    },
  },
  {
    // Aksi hapus user
    key: "delete",
    label: "Hapus User",
    icon: Trash2, // Ikon trash dari Lucide
    className: "hover:text-primary", // Styling hover
    disabled: false, // Tidak di-disable
    onClick: (user) => {
      // Callback untuk membuka dialog hapus
      openDeleteDialog(user);
    },
  },
];

// Untuk kompatibilitas mundur, export kolom default tanpa handler
export const userColumns = createUserColumns(() => {}, () => {});

// Aksi Bulk - untuk operasi pada multiple user sekaligus
export const userBulkActions = [
  {
    label: "Delete selected", // Label aksi
    action: "delete", // Tipe aksi
    variant: "destructive", // Variant styling (merah untuk delete)
    icon: Trash2, // Ikon untuk aksi bulk delete
  },
];
