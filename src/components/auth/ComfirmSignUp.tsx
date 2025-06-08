import { useState } from "react";
import { confirmSignUp } from "aws-amplify/auth";
import { useNavigate, useLocation } from "react-router-dom";

const ConfirmSignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get username from location state
  const username = location.state?.username;
  if (!username) {
    navigate("/signup"); // Redirect back to signup if no username is present
    return null;
  }
  console.log("username: ", username);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await confirmSignUp({
        username,
        confirmationCode: code,
      });
      navigate("/dashboard"); // Redirect to dashboard after confirmation
    } catch (error: any) {
      setError(error.message || "Error confirming sign up");
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

        <div>
          <h2 className="mt-6 text-center text-2xl font-bold text-white">
            Confirm your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Please enter the verification code sent to your email
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="code" className="block text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter verification code"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 text-red-200 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Confirming...
              </div>
            ) : (
              "Confirm Sign Up"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfirmSignUp;
