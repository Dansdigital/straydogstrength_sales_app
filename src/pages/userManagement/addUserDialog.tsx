import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../../amplify/data/resource";
import LoadingSpinner from "../../components/global/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";

const client = generateClient<Schema>();

interface AddUserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded?: () => void;
}

const AddUser = ({
  open,
  onOpenChange,
  onUserAdded,
}: AddUserProps) => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    tempPassword: "",
    groups: [] as string[],
  });
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      email: "",
      firstName: "",
      lastName: "",
      tempPassword: "",
      groups: [] as string[],
    }));
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const groupList = ["ADMINS", "MANAGERS", "VIEWERS"];
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const validations = {
        firstName: {
          value: formData.firstName,
          message: "First Name is required",
        },
        lastName: {
          value: formData.lastName,
          message: "Last Name is required",
        },
        email: { value: formData.email, message: "Email is required" },
        tempPassword: {
          value: formData.tempPassword,
          message: "Password is required",
        },
      };

      // Check all required fields
      for (const [, { value, message }] of Object.entries(validations)) {
        if (!value) {
          throw new Error(message);
        }
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate password requirements
      if (formData.tempPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      if (!/[A-Z]/.test(formData.tempPassword)) {
        throw new Error("Password must contain at least one uppercase letter");
      }

      if (!/[a-z]/.test(formData.tempPassword)) {
        throw new Error("Password must contain at least one lowercase letter");
      }

      if (!/\d/.test(formData.tempPassword)) {
        throw new Error("Password must contain at least one number");
      }

      if (selectedGroups.length === 0) {
        throw new Error("Please select at least one group");
      }

      setFormData((prev) => ({
        ...prev,
        groups: selectedGroups,
      }));

      console.log("Form data before submission:", formData);

      const createUserResponse = await client.graphql<{
        createNewUser: string;
      }>({
        query: `mutation CreateNewUser($email: String!, $firstName: String!, $lastName: String!, $tempPassword: String!, $groups: [String!]!) {
          createNewUser(email: $email, firstName: $firstName, lastName: $lastName, tempPassword: $tempPassword, groups: $groups)
        }`,
        variables: formData,
      });

      console.log("Create user response:", createUserResponse);
      onOpenChange(false);
      setError("");
      setLoading(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        tempPassword: "",
        groups: [],
      });
      setSelectedGroups([]);
      onUserAdded?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again.";
      console.error("Error creating user:", error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--higher-background)] text-[var(--primary)] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with appropriate access levels.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded-md">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempPassword">Temporary Password</Label>
            <div className="relative">
              <Input
                id="tempPassword"
                type={showPassword ? "text" : "password"}
                name="tempPassword"
                value={formData.tempPassword}
                onChange={handleChange}
                required
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                title="Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, and one number"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>User Groups</Label>
            <div className="space-y-2">
              {groupList.map((group) => (
                <div key={group} className="flex items-center space-x-2">
                  <Checkbox
                    id={group}
                    checked={selectedGroups.includes(group)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedGroups([...selectedGroups, group]);
                      } else {
                        setSelectedGroups(
                          selectedGroups.filter((g) => g !== group),
                        );
                      }
                    }}
                  />
                  <Label htmlFor={group}>{group}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUser;
