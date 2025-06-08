import React, { useState } from "react";
import { FaUser } from "react-icons/fa";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const ProfilePicture: React.FC = () => {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implement actual file upload logic here
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

      // Refresh the page after a short delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative group">
      <div
        className="w-32 h-32 rounded-full bg-[var(--button)] flex items-center justify-center cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FaUser className="w-16 h-16 text-[var(--button-text)]" />
        <div
          className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            variant="ghost"
            className="text-white hover:text-white hover:bg-transparent"
          >
            Change Photo
          </Button>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default ProfilePicture;
