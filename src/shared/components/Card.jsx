export function Card({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component className={`surface p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </Component>
  );
}
