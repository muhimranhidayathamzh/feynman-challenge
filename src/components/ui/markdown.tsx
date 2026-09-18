import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders user markdown safely:
 * - no raw HTML (react-markdown ignores it unless rehype-raw is added; it is not);
 * - unsafe link schemes (javascript:, data:) are stripped by react-markdown's
 *   default urlTransform;
 * - links open in a new tab without giving it access to this window.
 */
const COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (membuka tab baru)</span>
    </a>
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
