import ReactMarkdown from "react-markdown";

export function MarkdownContent({ children }) {
  return (
    <div className="prose prose-sm max-w-none leading-7">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
