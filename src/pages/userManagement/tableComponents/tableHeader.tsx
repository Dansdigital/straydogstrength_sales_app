import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Table } from "@tanstack/react-table";
import { User } from "../UserManagement";

interface TableHeaderProps {
  table: Table<User>;
  onAddUser: () => void;
  currentUserGroups: string[];
}

export function TableHeader({
  table,
  onAddUser,
  currentUserGroups,
}: TableHeaderProps) {
  return (
    <div className="flex items-center py-4">
      <div className="flex items-center justify-between w-full gap-2">
        <Input
          placeholder="Filter by name or email..."
          value={
            (table.getColumn("firstName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("firstName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button
          onClick={onAddUser}
          variant="outline"
          size="sm"
          disabled={!currentUserGroups.includes("Admin")}
          className="ml-2 border bg-[var(--primary-active)] hover:bg-[var(--primary-active)] text-[var(--primary-text)]"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>
  );
}
