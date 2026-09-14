export function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  const sizes = { sm: "min-h-9 px-3 text-sm", md: "min-h-11 px-4 text-sm", lg: "min-h-12 px-5" };
  return (
    <button
      className={`ui-button ui-button--${variant} inline-flex items-center justify-center gap-2 rounded-xl font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
