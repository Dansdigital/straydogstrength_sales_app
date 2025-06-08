import { FormEvent, useState } from "react";
import { signUp } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const form = event.currentTarget;
    const { email, password, tenantId } = form;

    try {
      await signUp({
        username: email.value,
        password: password.value,
        options: {
          userAttributes: {
            "custom:tenant_id": tenantId.value,
          },
        },
      });
      navigate("/confirm-signup", { state: { username: email.value } });
    } catch (error: any) {
      console.error("Error signing up:", error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img src="public/SD_red_header_LOGO.png" alt="straydog" width={100} height={100} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Organization ID</label>
            <input
              type="text"
              name="tenantId"
              required
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-900/50 text-red-200 p-3 rounded">
              {errorMessage}
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
                Signing up...
              </div>
            ) : (
              "Sign Up"
            )}
          </button>

          <div className="mt-4 text-center">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
