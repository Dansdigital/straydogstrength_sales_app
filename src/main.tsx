import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Amplify } from "aws-amplify";
import Layout from "./components/global/Layout.tsx";
import AuthGuard from "./components/auth/AuthGuard.tsx";
import Profile from "./pages/Profile";
import SignUp from "./components/auth/SignUp.tsx";
import ConfirmSignUp from "./components/auth/ComfirmSignUp.tsx";
import NotFound from "./pages/NotFound";
import Login from "./components/auth/LoginForm.tsx";
import ResetPassword from "./components/auth/ResetPassword";
import ChangePassword from "./components/auth/ChangePassword";
import OrgUsers from "./pages/userManagement/UserManagement.tsx";
import outputs from "../amplify_outputs.json";
import { RealProducts } from "./pages/realProducts.tsx";
import Test from "./pages/test.tsx";

Amplify.configure(outputs);

const Root = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="confirm-signup" element={<ConfirmSignUp />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="change-password" element={<ChangePassword />} />
        {/* Protected Routes */}
        <Route
          path="profile"
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          }
        />
        <Route
          path="products"
          element={
            <AuthGuard>
              <RealProducts />
            </AuthGuard>
          }
        />
        <Route
          path="user-management"
          element={
            <AuthGuard>
              <OrgUsers />
            </AuthGuard>
          }
        />
        <Route
          path="test"
          element={
            <AuthGuard>
              <Test />
            </AuthGuard>
          }
        />
        {/* 404 Route */}
        <Route path="*" element={
          <AuthGuard>
            <NotFound />
          </AuthGuard>
        } />
      </Route>
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
