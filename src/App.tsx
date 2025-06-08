import Login from "./components/auth/LoginForm";
import { CheckTheme } from "./components/Theme/ThemeChanger";
import { Toaster } from "./components/ui/toaster";

function App() {
  CheckTheme();
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Login />
      <Toaster />
    </div>
  );
}

export default App;
