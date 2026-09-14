import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";

function MermaidDiagram({ chart }) {
  const rawId = useId();
  const id = `mermaid-${rawId.replace(/:/g, "")}`;
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let active = true;
    import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral" });
      return mermaid.render(id, chart);
    }).then(({ svg: nextSvg }) => active && setSvg(nextSvg)).catch(() => setSvg(""));
    return () => { active = false; };
  }, [chart, id]);

  return svg ? <div className="my-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} /> : null;
}

export function MarkdownContent({ children }) {
  return (
    <div className="prose prose-sm max-w-none leading-7">
      <ReactMarkdown
        components={{
          code({ className, children: code }) {
            const language = /language-(\w+)/.exec(className || "")?.[1];
            if (language === "mermaid") return <MermaidDiagram chart={String(code).trim()} />;
            return <code className={className}>{code}</code>;
          }
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
