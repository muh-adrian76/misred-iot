import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ProfileInfoSection from "./profile-info";
import ProfilePasswordSection from "./profile-password";
import ProfileDeleteDialog from "./profile-delete";
import { TransitionPanel } from "@/components/ui/transition-panel";

export default function ProfileForm({ open, setOpen, user, setUser, router }) {
  const [username, setUsername] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [whatsappNotif, setWhatsappNotif] = useState(user?.whatsapp_notif || false);
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [openDeleteAccountDialog, setOpenDeleteAccountDialog] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Update state ketika user data berubah
  useEffect(() => {
    if (user) {
      setUsername(user?.name || "");
      setPhoneNumber(user?.phone || "");
      setWhatsappNotif(user?.whatsapp_notif || false);
    }
  }, [user]);
  
  const ITEMS = [
    {
      title: "Informasi Akun",
      // subtitle: "Refining Visual Harmony",
      content: (
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
