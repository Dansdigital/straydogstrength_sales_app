import { useState, useEffect } from "react";
import DefaultPageTemplate from "../defaultPageTemplate";
import {
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import LoadingMessage from "../../components/global/LoadingMessage";
import EditUserDialog from "./editUserDialog";
import { createColumns } from "./tableComponents/tableColumns";
import { TableHeader as TableHeaderComponent } from "./tableComponents/tableHeader";
import { TablePagination } from "./tableComponents/tablePagination";
import AddUser from "./addUserDialog";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../../amplify/data/resource";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { fetchCurrentUser } from "../../utils/fetchCurrentUser";

const client = generateClient<Schema>();

export interface User {
  firstName: string;
  email: string;
  lastName: string;
  createdAt: string;
  userId: string;
  groups: string[];
}

export interface UserResponse {
  listUsers: {
    items: User[];
  };
}

const getUsers = async (): Promise<User[]> => {
  try {
    const usersResponse = (await client.graphql({
      query: `query ListUsers {
        listUsers {
          items {
            firstName
            email
            lastName
            createdAt
            userId
            groups
          }
        }
      }`,
    })) as GraphQLResult<UserResponse>;
    const items = usersResponse.data?.listUsers.items || [];
    return items;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshUsers, setRefreshUsers] = useState(false);
  const [getUsersLoading, setGetUsersLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string[] | null>(null);

  const fetchCurrentUserGroups = async () => {
    try {
      const currentUser = await fetchCurrentUser();
      const groups = currentUser?.groups;
      setCurrentUser(groups);

    } catch (error) {
      console.error('Error fetching user groups:', error);
      setCurrentUser([]);
    }
  };

  useEffect(() => {
    fetchCurrentUserGroups();
    setGetUsersLoading(true);
    const fetchUsers = async () => {
      const users = await getUsers();
      setUsers(users);
      setGetUsersLoading(false);
    };

    fetchUsers();
  }, [refreshUsers]);

  const handleEditUser = (user: User) => {
    console.log("user: ", user);
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUserUpdated = () => {
    setRefreshUsers((prev) => !prev);
  };

  const columns = createColumns(handleEditUser, handleUserUpdated);

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <DefaultPageTemplate
      title="User Management"
      description="Manage users and their access to your Sales App."
    >
      <div className="w-full">
        <TableHeaderComponent
          table={table}
          onAddUser={() => setIsAddUserOpen(true)}
          currentUserGroups={currentUser || []}
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {getUsersLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    <LoadingMessage message="Loading users..." />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    <p className="ml-2">No users found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {users.length > 10 && <TablePagination table={table} />}
        {selectedUser && (
          <EditUserDialog
            user={selectedUser}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setSelectedUser(null);
              }
            }}
            onUserUpdated={handleUserUpdated}
          />
        )}
        <AddUser
          open={isAddUserOpen}
          onOpenChange={setIsAddUserOpen}
          onUserAdded={() => setRefreshUsers((prev) => !prev)}
        />
      </div>
    </DefaultPageTemplate>
  );
}
