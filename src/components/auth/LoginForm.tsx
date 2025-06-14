import { FormEvent, useState } from "react";
import {
  signIn,
  signOut,
  getCurrentUser,
  confirmSignIn,
} from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
// import { Link } from "react-router-dom";
// import { TenantStorage } from "../../utils/authStorage";
import LoadingSpinner from "../global/LoadingSpinner";
// src/assets/guardianIcon.svg

interface SignInFormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
  password: HTMLInputElement;
  tenantId: HTMLInputElement;
}

interface SignInForm extends HTMLFormElement {
  readonly elements: SignInFormElements;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  // const [session, setSession] = useState<any>(null)

  async function handleSubmit(event: FormEvent<SignInForm>) {
    event.preventDefault();
    const form = event.currentTarget;
    setErrorMessage("");
    setLoading(true);

    try {
      try {
        await getCurrentUser();
        await signOut();
      } catch {
        // No current user, continue with sign in
      }

      setValidating(true);
      const signInOutput = await signIn({
        username: form.elements.email.value,
        password: form.elements.password.value,
      });

      if (
        signInOutput.nextStep.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        setShowChangePassword(true);
      } else if (signInOutput.isSignedIn) {
        // await TenantStorage.getStoredData();
        setValidating(false);
        navigate("/products");
      }
    } catch (error: unknown) {
      console.error("Sign in error:", error);
      if (error instanceof Error) {
        if (error.name === "NotAuthorizedException") {
          setErrorMessage("Invalid username or password");
        } else if (error.name === "UserLambdaValidationException") {
          setErrorMessage("User does not belong to an organization");
        } else {
          setErrorMessage("User does not belong to an organization");
        }
      }
    } finally {
      setLoading(false);
      setValidating(false);
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordLoading(true);
    try {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (isSignedIn) {
        // await TenantStorage.getStoredData();
        navigate("/products");
      }
    } catch (error: unknown) {
      console.error("Error setting new password:", error);
      const message =
        error instanceof Error ? error.message : "Failed to set new password";
      setErrorMessage(message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="bg-[var(--color-bg-primary)] p-8 shadow-xl w-full border border-gray-300 max-w-md">
          <div className="flex items-center justify-center mb-6">
            <img src="/SD_red_header_LOGO.png" alt="straydog" className="w-[300px] object-cover" />
          </div>

          {errorMessage && (
            <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleNewPassword} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 text-white focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
                  required
                  minLength={8}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                  title="Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Password must contain at least 8 characters, one uppercase
                letter, one lowercase letter, one number and one special
                character
              </p>
            </div>

            <button
              type="submit"
              disabled={changePasswordLoading}
              className="w-full p-3 bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed"
            >
              {changePasswordLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner className="mr-2" />
                  Setting new password...
                </div>
              ) : (
                "Set New Password"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="bg-[var(--color-bg-primary)] p-8 border border-gray-300 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <img src="/SD_red_header_LOGO.png" alt="straydog" className="w-[300px] object-cover" />
        </div>
        {/* <h1 className="text-2xl font-bold mb-6 text-white text-center">Welcome Back</h1> */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div>
            <label className="block text-gray-300 mb-2">Organization ID</label>
            <input
              type="text"
              name="tenantId"
              required
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div> */}

          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 border border-gray-300 text-white focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full p-3 border border-gray-300 text-white focus:outline-none focus:border-[var(--color-primary)] bg-transparent"
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
            disabled={loading || validating}
            className="w-full p-3 bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed"
          >
            {loading || validating ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner className="mr-2" />
                {validating ? "Authenticating..." : "Signing in..."}
              </div>
            ) : (
              "Sign In"
            )}
          </button>
          {/* <div className="mt-4 text-center">
            <div className="mt-2">
              <Link
                to="/reset-password"
                className="text-blue-400 hover:text-blue-300"
              >
                Forgot Password?
              </Link>
            </div>
          </div> */}
        </form>
      </div>
    </div>
  );
}
