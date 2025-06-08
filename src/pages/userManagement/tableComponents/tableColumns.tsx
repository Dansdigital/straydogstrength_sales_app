import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../../../components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { User } from "../UserManagement";
import { TableActions } from "./tableActions";

export const createColumns = (
  handleEditUser: (user: User) => void,
  onUserDeleted: () => void,
): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 gap-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Member
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              `${user.firstName} ${user.lastName}`.trim() || user.email,
            )}`}
            alt={`${user.firstName} ${user.lastName}`}
            className="relative inline-block h-9 w-9 rounded-full object-cover object-center"
          />
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-[var(--primary-text)]">
              {`${user.firstName} ${user.lastName}`.trim() || user.email}
            </p>
            <p className="text-sm text-[var(--primary-text)]">{user.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "groups",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 gap-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Access Groups
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const groups = row.getValue("groups") as string[];
      return (
        <div className="flex gap-2">
          {groups.map((group: string) => (
            <span
              key={group}
              className="px-2 py-1 bg-[var(--primary-active)] text-[var(--primary-text)] rounded-full text-xs font-medium"
            >
              {group}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 gap-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <TableActions
          user={user}
          onEdit={handleEditUser}
          onUserDeleted={onUserDeleted}
        />
      );
    },
  },
];
