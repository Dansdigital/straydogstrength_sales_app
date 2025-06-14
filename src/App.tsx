import Login from "./components/auth/LoginForm";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Login />
      <Toaster />
    </div>
  );
}

export default App;
