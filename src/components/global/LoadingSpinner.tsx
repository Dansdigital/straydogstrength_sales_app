interface LoadingSpinnerProps {
  size?: number; // in rem
  borderWidth?: number; // in px
  color?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 1.25, // default to 5 tailwind units (1.25rem)
  borderWidth = 2,
  color = "white",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full ${className}`}
      style={{
        height: `${size}rem`,
        width: `${size}rem`,
        borderWidth: `${borderWidth}px`,
        borderColor: color,
        borderTopColor: "transparent",
      }}
    />
  );
}
