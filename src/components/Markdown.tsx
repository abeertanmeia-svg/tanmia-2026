import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
  );
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(<h2 key={key++}>{line.slice(3)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(<h2 key={key++}>{line.slice(2)}</h2>);
      i++;
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      out.push(
        <div key={key++} className="overflow-x-auto">
          <table>
            {head && (
              <thead>
                <tr>{head.map((c, ci) => <th key={ci}>{inline(c)}</th>)}</tr>
              </thead>
            )}
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{inline(c) || "\u00a0"}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-•]\s+/, ""));
        i++;
      }
      out.push(<ul key={key++}>{items.map((it, ii) => <li key={ii}>{inline(it)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      out.push(<ol key={key++}>{items.map((it, ii) => <li key={ii}>{inline(it)}</li>)}</ol>);
      continue;
    }
    out.push(<p key={key++}>{inline(line)}</p>);
    i++;
  }

  return <div className="prose-ar text-slate-700">{out}</div>;
}
