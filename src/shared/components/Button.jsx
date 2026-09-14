export function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  const variants = {
    primary: "bg-transparent text-brand hover:text-ink border-brand hover:border-ink",
    secondary: "bg-transparent text-ink hover:text-brand border-line hover:border-brand",
    soft: "bg-transparent text-brand hover:text-ink border-secondary",
    danger: "bg-transparent text-[var(--color-danger)] hover:text-ink border-transparent hover:border-danger",
    ghost: "bg-transparent text-muted hover:text-brand border-transparent"
  };
  const sizes = { sm: "min-h-10 px-3 text-sm", md: "min-h-12 px-5", lg: "min-h-14 px-6 text-lg" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
