// Import React hooks untuk state management
import { useState, useEffect } from "react";
// Import komponen Sheet untuk sidebar form layout
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
// Import section components untuk profile management
import ProfileInfoSection from "./profile-info";
import ProfilePasswordSection from "./profile-password";
import ProfileDeleteDialog from "./profile-delete";
// Import komponen TransitionPanel untuk smooth transitions
import { TransitionPanel } from "@/components/ui/transition-panel";

// Komponen ProfileForm untuk mengelola profil user dalam sidebar sheet
export default function ProfileForm({ open, setOpen, user, setUser, router }) {
  // State untuk form fields dengan data user yang ada
  const [username, setUsername] = useState(user?.name || ""); // Nama user
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || ""); // Nomor telepon user
  const [whatsappNotif, setWhatsappNotif] = useState(user?.whatsapp_notif || false); // Setting notifikasi WhatsApp
  
  // State untuk password management
  const [showPassword, setShowPassword] = useState(false); // Visibility password fields
  const [oldPassword, setOldPassword] = useState(""); // Password lama untuk verifikasi
  const [newPassword, setNewPassword] = useState(""); // Password baru
  
  // State untuk delete account functionality
  const [openDeleteAccountDialog, setOpenDeleteAccountDialog] = useState(false); // Modal delete account
  const [deleteChecked, setDeleteChecked] = useState(false); // Checkbox konfirmasi delete
  
  // State untuk UI control
  const [isEditing, setIsEditing] = useState(false); // Mode editing profile
  const [activeIndex, setActiveIndex] = useState(0); // Index active section dalam TransitionPanel
  
  // Update state ketika user data berubah dari props
  useEffect(() => {
    if (user) {
      setUsername(user?.name || ""); // Sync nama user
      setPhoneNumber(user?.phone || ""); // Sync nomor telepon
      setWhatsappNotif(user?.whatsapp_notif || false); // Sync setting WhatsApp
    }
  }, [user]);
  
  // Array items untuk TransitionPanel dengan section yang berbeda
  const ITEMS = [
    {
      title: "Informasi Akun", // Title section informasi
      // subtitle: "Refining Visual Harmony", // Optional subtitle (commented out)
      content: (
        // Section untuk mengedit informasi dasar akun
        <ProfileInfoSection
          user={user}
          username={username}
          setUsername={setUsername}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          whatsappNotif={whatsappNotif}
          setWhatsappNotif={setWhatsappNotif}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          setOpenDeleteAccountDialog={setOpenDeleteAccountDialog}
          setUser={setUser}
        />
      ),
    },
    {
      title: "Ganti Kata Sandi",
      // subtitle: "Narrative and Expression",
      content: (
        <ProfilePasswordSection
          user={user}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          oldPassword={oldPassword}
          setOldPassword={setOldPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
        />
      ),
    },
    // {
    //   title: "Tab lain",
    //   subtitle: "Keterangan",
    //   content:
    //     "Isi dengan apapun.",
    // },
  ];
  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md w-full">
          <SheetHeader className="border-b-2">
            <SheetTitle>Pengaturan Akun</SheetTitle>
          </SheetHeader>
          <SheetDescription className="hidden" />
          <div className="flex flex-col w-full h-full py-6 px-0 items-center gap-4">
            <div className="flex space-x-2">
              {ITEMS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${
                    activeIndex === index
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
            <div className="overflow-hidden w-full h-full px-8">
              <TransitionPanel
                activeIndex={activeIndex}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                variants={{
                  enter: { opacity: 0, y: -50, filter: "blur(4px)" },
                  center: { opacity: 1, y: 0, filter: "blur(0px)" },
                  exit: { opacity: 0, y: 50, filter: "blur(4px)" },
                }}
              >
                {ITEMS.map((item, index) => (
                  <div key={index} className="py-2">
                    {/* <h3 className="mb-2 font-medium text-zinc-800 dark:text-zinc-100">
                    {item.subtitle}
                  </h3> */}
                    {item.content}
                  </div>
                ))}
              </TransitionPanel>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <ProfileDeleteDialog
        open={openDeleteAccountDialog}
        setOpen={setOpenDeleteAccountDialog}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
        router={router}
      />
    </>
  );
}
