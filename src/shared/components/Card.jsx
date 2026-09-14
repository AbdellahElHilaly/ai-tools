export function Card({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component className={`surface p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </Component>
  );
}
