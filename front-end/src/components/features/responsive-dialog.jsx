"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ResponsiveDialog({
  open,
  setOpen,
  title,
  description,
  form = false,
  formHandle = null,
  checkbox = false,
  confirmText,
  cancelText,
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {form && (
            <form onSubmit={formHandle} className="flex flex-col gap-4">
              {form}
            </form>
          )}
          {!form && <div className="flex flex-col gap-4">{description}</div>}
          {checkbox}
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {form && (
          <form onSubmit={formHandle} className="flex flex-col gap-4">
            {form}
          </form>
        )}
        {!form && <div className="flex flex-col gap-4">{description}</div>}
        {checkbox}
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {cancelText || "Cancel"}
          </Button>
          <Button type="submit" form={form ? "responsive-dialog-form" : null}>
            {confirmText || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
