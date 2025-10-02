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

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'enable' | 'disable';
  userName: string;
  onConfirm: () => void;
}

export function UserStatusDialog({
  open,
  onOpenChange,
  action,
  userName,
  onConfirm
}: UserStatusDialogProps) {
  const isEnable = action === 'enable';
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isEnable ? 'Enable User Account' : 'Disable User Account'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {action} the account for <strong>{userName}</strong>?
            {!isEnable && (
              <span className="block mt-2 text-sm">
                This will prevent the user from logging in and accessing the system.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={!isEnable ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isEnable ? 'Enable User' : 'Disable User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}