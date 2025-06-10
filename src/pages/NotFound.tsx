const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-primary)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--color-text-primary)]">404</h1>
        <p className="text-xl mt-4 text-[var(--color-text-primary)]">
          Page not found
        </p>
        <a
          href="/"
          className="mt-6 inline-block bg-[var(--button)] text-[var(--button-text)] hover:bg-[var(--button-hover)]"
        >
          Go back home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
