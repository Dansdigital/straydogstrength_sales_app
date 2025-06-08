// import React, { useEffect, useState } from "react";
// import {
//   updateUserAttributes,
//   fetchUserAttributes,
//   getCurrentUser,
//   fetchAuthSession,
// } from "aws-amplify/auth";
// import { Input } from "../components/ui/input";
// import { Button } from "../components/ui/button";
// import { Label } from "../components/ui/label";
// import { ScrollArea } from "../components/ui/scroll-area";
// import { useToast } from "../components/ui/use-toast";
// import ThemeChanger from "../components/Theme/ThemeChanger";
// import ProfilePicture from "../components/global/ProfilePicture";

const Profile: React.FC = () => {
  // const { toast } = useToast();
  // const [formData, setFormData] = useState({
  //   // Personal profile data
  //   firstName: "",
  //   lastName: "",
  //   personalEmail: "",
  //   personalPhone: "",
  //   // Company profile data
  //   companyName: "",
  //   companyEmail: "",
  //   companyPhone: "",
  //   addressLine1: "",
  //   addressLine2: "",
  //   city: "",
  //   state: "",
  //   zipCode: "",
  // });
  // const [loading, setLoading] = useState(true);
  // const [userGroups, setUserGroups] = useState<string[]>([]);
  // const [tenantData, setTenantData] = useState<TenantInfo | null>(null);

  // Fetch user attributes when component mounts
  // useEffect(() => {
  //   async function loadUserData() {
  //     try {
  //       const [attributes, user, session] = await Promise.all([
  //         fetchUserAttributes(),
  //         getCurrentUser(),
  //         fetchAuthSession(),
  //         // TenantStorage.getStoredData(),
  //       ]);

  //       // setTenantData(tenantData?.tenant || null); // Set the tenant data state
  //       setFormData({
  //         firstName: attributes.given_name || "",
  //         lastName: attributes.family_name || "",
  //         personalEmail: user.signInDetails?.loginId || "",
  //         personalPhone: attributes.phone_number || "",
  //         companyName: attributes["custom:companyName"] || "",
  //         companyEmail: attributes["custom:companyEmail"] || "",
  //         companyPhone: attributes["custom:companyPhone"] || "",
  //         addressLine1: attributes["custom:addressLine1"] || "",
  //         addressLine2: attributes["custom:addressLine2"] || "",
  //         city: attributes["custom:city"] || "",
  //         state: attributes["custom:state"] || "",
  //         zipCode: attributes["custom:zipCode"] || "",
  //       });

  //       // const groups =
  //       //   (session.tokens?.accessToken.payload["cognito:groups"] as string[]) ||
  //       //   [];
  //       // setUserGroups(groups);
  //     } catch (error) {
  //       console.error("Error loading user data:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   loadUserData();
  // }, []);

  // useEffect(() => {
  // async function loadTenantData() {
  //   //   const data = await TenantStorage.getStoredData();
  //   //   setTenantData(data?.tenant || null);
  // }
  // loadTenantData();
  // }, []);

  // const handleInputChange = (field: string, value: string) => {
  //   setFormData((prev) => ({ ...prev, [field]: value }));
  // };

  // const handleSubmit = async () => {
  //   try {
  //     const attributes: Record<string, string> = {};
  //     if (formData.firstName) attributes.given_name = formData.firstName;
  //     if (formData.lastName) attributes.family_name = formData.lastName;
  //     if (formData.personalPhone)
  //       attributes.phone_number = formData.personalPhone;
  //     if (formData.personalEmail) attributes.email = formData.personalEmail;
  //     if (formData.companyName)
  //       attributes["custom:companyName"] = formData.companyName;
  //     if (formData.companyEmail)
  //       attributes["custom:companyEmail"] = formData.companyEmail;
  //     if (formData.companyPhone)
  //       attributes["custom:companyPhone"] = formData.companyPhone;
  //     if (formData.addressLine1)
  //       attributes["custom:addressLine1"] = formData.addressLine1;
  //     if (formData.addressLine2)
  //       attributes["custom:addressLine2"] = formData.addressLine2;
  //     if (formData.city) attributes["custom:city"] = formData.city;
  //     if (formData.state) attributes["custom:state"] = formData.state;
  //     if (formData.zipCode) attributes["custom:zipCode"] = formData.zipCode;

  //     await updateUserAttributes({
  //       userAttributes: attributes,
  //     });

  //     toast({
  //       title: "Success",
  //       description: "Profile updated successfully",
  //     });

  //     // Refresh the page after a short delay to show the toast
  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 1500);
  //   } catch (error) {
  //     console.error("Error updating profile:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to update profile",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // if (loading) {
  //   return <div className="p-4">Loading...</div>;
  // }

  return (
    // <ScrollArea className="h-screen">
    //   <div className="p-8 text-[var(--primary)]">
    //     {/* Header Section */}
    //     <div className="flex flex-col mb-8 md:flex-row gap-8">
    //       {/* Profile Picture Section */}
    //       <div className="w-full md:w-1/3 p-6 bg-[var(--higher-background)] rounded-lg border border-[var(--border-color)] flex flex-col items-center">
    //         <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
    //         {/* <ProfilePicture /> */}
    //       </div>

    //       {/* User Info Section */}
    //       <div className="w-full md:w-2/3 space-y-6">
    //         {/* User Role Section */}
    //         <div className="p-6 bg-[var(--higher-background)] rounded-lg border border-[var(--border-color)]">
    //           <h2 className="text-xl font-semibold mb-3">User Groups</h2>
    //           {userGroups.length > 0 ? (
    //             <div className="flex flex-wrap gap-2">
    //               {userGroups.map((group, index) => (
    //                 <span
    //                   key={index}
    //                   className="px-4 py-2 rounded-full text-sm bg-[var(--button)] text-[var(--button-text)]"
    //                 >
    //                   {group}
    //                 </span>
    //               ))}
    //             </div>
    //           ) : (
    //             <p className="text-gray-500">No Role assigned</p>
    //           )}
    //         </div>

    //         {/* Theme Settings Section */}
    //         <div className="p-6 bg-[var(--higher-background)] rounded-lg border border-[var(--border-color)]">
    //           <h2 className="text-xl font-semibold mb-3">Theme Settings</h2>
    //           <ThemeChanger />
    //         </div>
    //       </div>
    //     </div>

    //     {/* Profile Sections */}
    //     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    //       {/* Personal Profile Section */}
    //       <div className="p-6 bg-[var(--higher-background)] rounded-lg border border-[var(--border-color)]">
    //         <h2 className="text-xl font-semibold mb-6">Personal Profile</h2>
    //         <div className="space-y-6">
    //           <div className="grid grid-cols-1 gap-6">
    //             <div className="space-y-2">
    //               <Label htmlFor="firstName">First Name</Label>
    //               <Input
    //                 id="firstName"
    //                 value={formData.firstName}
    //                 onChange={(e) =>
    //                   handleInputChange("firstName", e.target.value)
    //                 }
    //               />
    //             </div>
    //             <div className="space-y-2">
    //               <Label htmlFor="lastName">Last Name</Label>
    //               <Input
    //                 id="lastName"
    //                 value={formData.lastName}
    //                 onChange={(e) =>
    //                   handleInputChange("lastName", e.target.value)
    //                 }
    //               />
    //             </div>
    //             <div className="space-y-2">
    //               <Label htmlFor="personalEmail">Email</Label>
    //               <Input
    //                 id="personalEmail"
    //                 value={formData.personalEmail}
    //                 onChange={(e) =>
    //                   handleInputChange("personalEmail", e.target.value)
    //                 }
    //               />
    //             </div>
    //             <div className="space-y-2">
    //               <Label htmlFor="personalPhone">Phone Number</Label>
    //               <Input
    //                 id="personalPhone"
    //                 value={formData.personalPhone}
    //                 onChange={(e) =>
    //                   handleInputChange("personalPhone", e.target.value)
    //                 }
    //               />
    //             </div>
    //           </div>
    //         </div>
    //       </div>

    //       {/* Company Profile Section */}
    //       <div className="p-6 bg-[var(--higher-background)] rounded-lg border border-[var(--border-color)]">
    //         <h2 className="text-xl font-semibold mb-6">Company Profile</h2>
    //         <div className="space-y-6">
    //           <div className="mb-6">
    //             <h3 className="text-lg font-medium mb-3">Organization Info</h3>
    //             {tenantData ? (
    //               <div className="space-y-3">
    //                 {tenantData.tenantName && (
    //                   <div className="flex items-center">
    //                     <span className="w-32 font-medium">Name:</span>
    //                     <span className="text-gray-700">
    //                       {tenantData.tenantName}
    //                     </span>
    //                   </div>
    //                 )}
    //                 {tenantData.type && (
    //                   <div className="flex items-center">
    //                     <span className="w-32 font-medium">Type:</span>
    //                     <span className="text-gray-700">{tenantData.type}</span>
    //                   </div>
    //                 )}
    //               </div>
    //             ) : (
    //               <p className="text-gray-500">
    //                 No organization information available
    //               </p>
    //             )}
    //           </div>
    //           <div className="space-y-4">
    //             <div className="space-y-2">
    //               <Label className="text-gray-500">Company Name</Label>
    //               <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
    //                 {formData.companyName || "Not provided"}
    //               </div>
    //             </div>
    //             <div className="space-y-2">
    //               <Label className="text-gray-500">Company Email</Label>
    //               <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
    //                 {formData.companyEmail || "Not provided"}
    //               </div>
    //             </div>
    //             <div className="space-y-2">
    //               <Label className="text-gray-500">Company Phone</Label>
    //               <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
    //                 {formData.companyPhone || "Not provided"}
    //               </div>
    //             </div>
    //             <div className="space-y-2">
    //               <Label className="text-gray-500">Address</Label>
    //               <div className="p-2 bg-gray-50 rounded-md border border-gray-200 space-y-1">
    //                 <div>{formData.addressLine1 || "Not provided"}</div>
    //                 <div>{formData.addressLine2}</div>
    //                 <div>
    //                   {formData.city && formData.state && formData.zipCode
    //                     ? `${formData.city}, ${formData.state} ${formData.zipCode}`
    //                     : "Not provided"}
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Action Buttons */}
    //     <div className="sticky bottom-0 bg-[var(--background)] py-4 flex flex-row-reverse gap-4">
    //       <Button
    //         className="bg-[var(--button)] text-[var(--button-text)] hover:bg-[var(--button-hover)]"
    //         onClick={handleSubmit}
    //       >
    //         Update Profile
    //       </Button>
    //       <Button variant="outline">Cancel</Button>
    //     </div>
    //   </div>
    // </ScrollArea>
    <div>Profile</div>
  );
};

export default Profile;
