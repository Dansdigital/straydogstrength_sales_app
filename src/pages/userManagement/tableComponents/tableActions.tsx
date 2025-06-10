import { Button } from "../../../components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { User } from "../UserManagement";
import { useState } from "react";
import DeleteUserDialog from "../deleteUserDialog";

interface TableActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onUserDeleted: () => void;
}

export function TableActions({
  user,
  onEdit,
  onUserDeleted,
}: TableActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
        >
          <DropdownMenuItem
            onClick={() => onEdit(user)}
          >
            Edit User
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteUserDialog
        user={user}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onUserDeleted={onUserDeleted}
      />
    </>
  );
}
