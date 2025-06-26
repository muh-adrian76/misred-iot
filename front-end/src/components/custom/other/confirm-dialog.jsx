import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConfirmDialog({
  open,
  setOpen,
  title,
  description,
  checkbox = false,
  confirmHandle,
  confirmText,
  cancelText,
  confirmDisabled = false,
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="w-96">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
            {checkbox}
        <AlertDialogFooter>
          <AlertDialogAction className="cursor-pointer" onClick={confirmHandle} disabled={confirmDisabled}>
            {confirmText}
          </AlertDialogAction>
          <AlertDialogCancel
            className="cursor-pointer"
          >
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
