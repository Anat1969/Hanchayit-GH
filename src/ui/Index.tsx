import type { SectionNode } from '../rules/derive.ts';
import s from './Index.module.css';

function Cube() {
  return (
    <svg className={s.cube} viewBox="0 0 12 12" aria-label="יש המחשה" role="img">
      <path d="M6 1 11 3.5V8.5L6 11 1 8.5V3.5Z M1 3.5 6 6 11 3.5 M6 6V11" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function firstRule(n: SectionNode): string | undefined {
  return n.rules[0]?.id ?? n.children.map(firstRule).find(Boolean);
}

function Node({ node, activeSections, onNavigate }: {
  node: SectionNode;
  activeSections: Set<string>;
  onNavigate: (ruleId: string) => void;
}) {
  const { section } = node;
  const active = activeSections.has(section.id);
  return (
    <li>
      <button
        type="button"
        className={s.item}
        aria-current={active ? 'location' : undefined}
        onClick={() => {
          const id = firstRule(node);
          if (id) onNavigate(id);
        }}
      >
        {section.ref && <span className={s.ref}>{section.ref}</span>}
        <span className={s.title}>{section.title}</span>
        {node.rules.some((r) => r.scene) && <Cube />}
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Node key={c.section.id} node={c} activeSections={activeSections} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Index({ tree, activeSections, onNavigate }: {
  tree: SectionNode[];
  activeSections: Set<string>;
  onNavigate: (ruleId: string) => void;
}) {
  return (
    <nav className={s.index} aria-label="תוכן עניינים">
      <ul>
        {tree.map((n) => (
          <Node key={n.section.id} node={n} activeSections={activeSections} onNavigate={onNavigate} />
        ))}
      </ul>
    </nav>
  );
}

