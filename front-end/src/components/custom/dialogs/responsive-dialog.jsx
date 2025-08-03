// Menggunakan "use client" untuk komponen React sisi klien
"use client";

// Import komponen UI
import { Button } from "@/components/ui/button";
// Import komponen Dialog untuk desktop
import {
  Dialog, // Container dialog untuk desktop
  DialogContent, // Konten dialog
  DialogDescription, // Deskripsi dialog
  DialogHeader, // Header dialog
  DialogTitle, // Judul dialog
  DialogFooter, // Footer dialog
} from "@/components/ui/dialog";
// Import komponen Drawer untuk mobile
import {
  Drawer, // Container drawer untuk mobile
  DrawerClose, // Button close drawer
  DrawerContent, // Konten drawer
  DrawerDescription, // Deskripsi drawer
  DrawerFooter, // Footer drawer
  DrawerHeader, // Header drawer
  DrawerTitle, // Judul drawer
} from "@/components/ui/drawer";
// Import efek glow dan hook mobile
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useBreakpoint } from "@/hooks/use-mobile";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";

// Komponen dialog yang responsif - menggunakan drawer di mobile, dialog di desktop
export default function ResponsiveDialog({
  open, // State apakah dialog/drawer terbuka
  setOpen, // Setter untuk mengontrol state
  title, // Judul dialog/drawer
  description, // Deskripsi opsional
  content = false, // Konten jika tidak berupa form
  contentHandle = null, // Handler untuk konten jika tidak berupa form
  form = false, // Apakah konten berupa form
  formHandle = null, // Handler untuk submit form
  checkbox = false, // Komponen checkbox opsional
  confirmText, // Teks button konfirmasi
  cancelText, // Teks button batal
  loading = false, // Status loading untuk disable buttons
  oneButton = false, // Apakah hanya ada satu button konfirmasi
  disabled = false, // Status disabled untuk button konfirmasi
}) {
  // Hook untuk deteksi breakpoint layar
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Jika mobile, gunakan Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="rounded-t-2xl pb-4 px-4">
          {/* Header drawer dengan judul */}
          <DrawerHeader className="text-center pt-4 pb-2 px-2">
            <DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
            <DrawerDescription className="text-muted-foreground hidden text-balance">
              {description || ""}
            </DrawerDescription>
          </DrawerHeader>
          {/* Conditional rendering berdasarkan apakah konten berupa form */}
          {form ? (
            <form
              id="responsive-dialog-form" // ID untuk form submission
              onSubmit={formHandle}
              className="flex flex-col gap-1 px-2"
            >
              <div className="flex flex-col gap-4">{form}</div>
              {checkbox && <div className="mt-2">{checkbox}</div>}
              <DrawerFooter>
                <Button type="submit" disabled={loading || disabled}>
                  {confirmText || "Submit"}
                </Button>
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className={oneButton ? "hidden" : ""}
                  >
                    {cancelText || "Cancel"}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          ) : (
            <>
              <div className="flex flex-col gap-4 px-2 py-2">{content}</div>
              {checkbox && <div className="mt-2">{checkbox}</div>}
              <DrawerFooter>
                <Button onClick={() => setOpen(false)}>
                  {confirmText || "OK"}
                </Button>
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className={oneButton ? "hidden" : ""}
                  >
                    {cancelText || "Cancel"}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[625px] rounded-2xl px-6 py-6 border">
        <GlowingEffect
          spread={45}
          glow={true}
          disabled={false}
          proximity={72}
          inactiveZone={0.02}
        />
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-balance">
            {description || ""}
          </DialogDescription>
        </DialogHeader>
        {form ? (
          <form
            id="responsive-dialog-form"
            onSubmit={formHandle}
            className="flex flex-col gap-5 px-2 py-2"
          >
            <div className="flex flex-col gap-4">{form}</div>
            {checkbox && <div className="mt-2">{checkbox}</div>}
            <DialogFooter>
              <Button type="submit" disabled={loading || disabled}>
                {confirmText || "Submit"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
                className={oneButton ? "hidden" : ""}
              >
                {cancelText || "Cancel"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="flex flex-col gap-4 px-2 py-2">{content}</div>
            {checkbox && <div className="mt-2">{checkbox}</div>}
            <DialogFooter>
              <Button
                onClick={() =>
                  contentHandle ? contentHandle() : setOpen(false)
                }
                disabled={loading}
              >
                {confirmText || "Yes"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
                className={oneButton ? "hidden" : ""}
              >
                {cancelText || "Cancel"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
