const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--pop-up)] text-[var(--primary)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl mt-4">Page not found</p>
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
