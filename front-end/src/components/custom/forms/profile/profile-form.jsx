import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
} from "@/components/ui/accordion";
import ProfileInfoSection from "./profile-info";
import ProfilePasswordSection from "./profile-password";
import ProfileDeleteDialog from "./profile-delete";

export default function ProfileForm({ open, setOpen, user, setUser, router }) {
  const [username, setUsername] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [showPassword, setShowPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [openDeleteAccountDialog, setOpenDeleteAccountDialog] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-md w-full">
          <SheetHeader className="border-b-2">
            <SheetTitle>Pengaturan Akun</SheetTitle>
          </SheetHeader>
          <SheetDescription className="hidden" />
          <div className="p-4 space-y-6 my-auto">
            <Accordion type="single" collapsible defaultValue="account-info">
              <ProfileInfoSection
                user={user}
                username={username}
                setUsername={setUsername}
                phoneNumber={phoneNumber}
                setPhoneNumber={setPhoneNumber}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                setOpenDeleteAccountDialog={setOpenDeleteAccountDialog}
                setUser={setUser}
              />
              <ProfilePasswordSection
                user={user}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                oldPassword={oldPassword}
                setOldPassword={setOldPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
              />
            </Accordion>
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