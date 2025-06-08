import { useState } from "react";
import { updatePassword } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const oldPassword = (
      form.elements.namedItem("oldPassword") as HTMLInputElement
    ).value;
    const newPassword = (
      form.elements.namedItem("newPassword") as HTMLInputElement
    ).value;
    const confirmPassword = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await updatePassword({ oldPassword, newPassword });
      setSuccess("Password updated successfully!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error: any) {
      console.error("Error updating password:", error);
      setError(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img src="public/SD_red_header_LOGO.png" alt="Guardian" width={100} height={100} />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-white text-center">
          Change Password
        </h1>
        <p className="text-gray-400 mb-6 text-center">
          Please change your temporary password to continue
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/50 text-green-200 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">
              Temporary Password
            </label>
            <input
              type="password"
              name="oldPassword"
              required
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Updating...
              </div>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-400">
          <p>Password must:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Be at least 8 characters long</li>
            <li>Include at least one uppercase letter</li>
            <li>Include at least one lowercase letter</li>
            <li>Include at least one number</li>
            <li>Include at least one special character</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
