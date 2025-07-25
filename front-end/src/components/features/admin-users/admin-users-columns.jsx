import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Crown, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2
} from "lucide-react";

// User Avatar Component
function UserAvatar({ user }) {
  return (
    <Avatar className="h-10 w-10">
      <AvatarFallback className="bg-primary/10 text-primary">
        {user.name?.charAt(0) || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}

// Status Badge Component
function StatusBadge({ user }) {
  return (
    <div className="flex flex-col gap-1">
      <Badge 
        key="onboarding"
        variant={user.onboarding_completed ? "default" : "secondary"}
        className="text-xs"
      >
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
      <Badge 
        key="whatsapp"
        variant={user.whatsapp_notif ? "outline" : "secondary"}
        className="text-xs"
      >
        WhatsApp: {user.whatsapp_notif ? 'Aktif' : 'Nonaktif'}
      </Badge>
    </div>
  );
}

// Role Badge Component
function RoleBadge({ user }) {
  return (
    <Badge 
      variant={user.is_admin ? "default" : "secondary"}
      className={user.is_admin ? "bg-purple-100 text-purple-800 hover:bg-purple-200" : ""}
    >
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

// Column Definitions - function to receive handlers
export const createUserColumns = (onEdit, onDelete) => [
  {
    key: "user",
    label: "User",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="flex items-center space-x-3">
        <UserAvatar user={user} />
        <div>
          <div className="font-medium text-sm">
            {user.name || 'Unknown User'}
          </div>
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "phone",
    label: "Nomor Telepon",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="text-sm">
        {user.phone || '-'}
      </div>
    ),
  },
  {
    key: "status",
    label: "Status & Notifikasi",
    sortable: false,
    filterable: true,
    filterOptions: ["completed", "not_completed", "whatsapp_enabled", "whatsapp_disabled"],
    render: (user) => <StatusBadge user={user} />,
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    filterable: true,
    filterOptions: ["admin", "user"],
    render: (user) => <RoleBadge user={user} />,
  },
  {
    key: "last_login",
    label: "Terakhir Login",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="text-sm">
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
    key: "created_at",
    label: "Tanggal Daftar",
    sortable: true,
    filterable: false,
    render: (user) => (
      <div className="text-sm">
        {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : 'Unknown'}
      </div>
    ),
  },
];

// Row Actions (seperti di device-content.jsx)
export const createUserRowActions = (openEditDialog, openDeleteDialog) => [
  {
    key: "edit",
    label: "Edit User",
    icon: Edit,
    className: "hover:text-foreground",
    disabled: false,
    onClick: (user) => {
      openEditDialog(user);
    },
  },
  {
    key: "delete",
    label: "Hapus User",
    icon: Trash2,
    className: "hover:text-primary",
    disabled: false,
    onClick: (user) => {
      openDeleteDialog(user);
    },
  },
];

// For backward compatibility, export a default columns without handlers
export const userColumns = createUserColumns(() => {}, () => {});

// Bulk Actions
export const userBulkActions = [
  {
    label: "Delete selected",
    action: "delete",
    variant: "destructive",
    icon: Trash2,
  },
];
