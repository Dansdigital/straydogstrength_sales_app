import { useState } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../../amplify/data/resource";
import { User } from "./UserManagement";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const client = generateClient<Schema>();

const AVAILABLE_GROUPS = ["ADMINS", "MANAGERS", "VIEWERS"];

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export default function EditUserDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
}: EditUserDialogProps) {
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    groups: user.groups || [],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGroupChange = (group: string) => {
    setFormData((prev) => ({
      ...prev,
      groups: prev.groups.includes(group)
        ? prev.groups.filter((g) => g !== group)
        : [...prev.groups, group],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await client.graphql({
        query: `mutation UpdateUser($userId: String!, $firstName: String!, $lastName: String!, $newGroups: [String!]!) {
                    updateAUser(userId: $userId, firstName: $firstName, lastName: $lastName, newGroups: $newGroups)
                }`,
        variables: {
          userId: user.userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          newGroups: formData.groups,
        },
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--higher-background)] text-[var(--primary)]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to the user's information here.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-md">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email}
              onChange={handleInputChange}
              required
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label>Access Groups</Label>
            <div className="space-y-2">
              {AVAILABLE_GROUPS.map((group) => (
                <div key={group} className="flex items-center space-x-2">
                  <Checkbox
                    id={group}
                    className="data-[state=checked]:border-[var(--primary-active)] data-[state=checked]:bg-[var(--primary-active)] data-[state=checked]:text-[var(--button-text)]"
                    checked={formData.groups.includes(group)}
                    onCheckedChange={() => handleGroupChange(group)}
                  />
                  <Label htmlFor={group}>{group}</Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--button)] text-[var(--button-text)] hover:bg-[var(--button-hover)]"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
