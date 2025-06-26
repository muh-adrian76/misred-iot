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
  loading = false,
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="rounded-t-2xl pb-4 px-4">
          <DrawerHeader className="text-left pt-4 pb-2 px-2">
            <DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">{description || ""}</DrawerDescription>
          </DrawerHeader>
          {form ? (
            <form
              id="responsive-dialog-form"
              onSubmit={formHandle}
              className="flex flex-col gap-5 px-2 py-2"
            >
              <div className="flex flex-col gap-4">{form}</div>
              {checkbox && <div className="mt-2">{checkbox}</div>}
              <div className="pt-4 flex gap-2 justify-center">
                <DrawerClose asChild>
                  <Button variant="outline">{cancelText || "Cancel"}</Button>
                </DrawerClose>
                <Button type="submit" disabled={loading}>
                  {confirmText || "Submit"}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-col gap-4 px-2 py-2">{description}</div>
              {checkbox && <div className="mt-2">{checkbox}</div>}
              <DrawerFooter className="pt-4 flex gap-2 justify-center">
                <DrawerClose asChild>
                  <Button variant="outline">{cancelText || "Cancel"}</Button>
                </DrawerClose>
                <Button onClick={() => setOpen(false)}>
                  {confirmText || "OK"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[625px] rounded-2xl px-6 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description || ""}</DialogDescription>
        </DialogHeader>
        {form ? (
          <form
            id="responsive-dialog-form"
            onSubmit={formHandle}
            className="flex flex-col gap-5 px-2 py-2"
          >
            <div className="flex flex-col gap-4">{form}</div>
            {checkbox && <div className="mt-2">{checkbox}</div>}
            <DialogFooter className="pt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                {cancelText || "Cancel"}
              </Button>
              <Button type="submit" disabled={loading}>
                {confirmText || "Submit"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="flex flex-col gap-4 px-2 py-2">{description}</div>
            {checkbox && <div className="mt-2">{checkbox}</div>}
            <DialogFooter className="pt-4 flex gap-2 justify-center">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                {cancelText || "Cancel"}
              </Button>
              <Button onClick={() => setOpen(false)}>
                {confirmText || "OK"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}