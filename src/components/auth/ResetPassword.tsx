import { useState } from "react";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await resetPassword({ username: email });
      setSuccess("Code sent! Please check your email.");
      setStep("confirm");
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setError("Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const code = (form.elements.namedItem("code") as HTMLInputElement).value;
    const newPassword = (
      form.elements.namedItem("newPassword") as HTMLInputElement
    ).value;

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      setSuccess("Password reset successful!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error confirming password reset:", error);
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img src="public/SD_red_header_LOGO.png" alt="straydog" width={100} height={100} />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-white text-center">
          Reset Password
        </h1>

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

        {step === "request" ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Reset Code</label>
              <input
                type="text"
                name="code"
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
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate("/login")}
          className="mt-4 w-full p-3 rounded bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
