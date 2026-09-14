export function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  const variants = {
    primary: "bg-ink text-white hover:bg-brand border-ink",
    secondary: "bg-white text-ink hover:bg-brand/5 border-line",
    soft: "bg-[var(--color-brand-soft)] text-brand hover:bg-emerald-100 border-transparent",
    danger: "bg-white text-[var(--color-danger)] hover:bg-red-50 border-red-200",
    ghost: "bg-transparent text-ink hover:bg-black/5 border-transparent"
  };
  const sizes = { sm: "min-h-10 px-3 text-sm", md: "min-h-12 px-5", lg: "min-h-14 px-6 text-lg" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
