import type { SectionNode } from '../rules/derive.ts';
import { Icon, topicIcon } from './icons.tsx';
import s from './Index.module.css';


function firstRule(n: SectionNode): string | undefined {
  return n.rules[0]?.id ?? n.children.map(firstRule).find(Boolean);
}

function Node({ node, depth, activeSections, onNavigate }: {
  node: SectionNode;
  depth: number;
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
        {depth === 1 && <Icon name={topicIcon(section.title)} />}
        {section.ref && <span className={s.ref}>{section.ref}</span>}
        <span className={s.title}>{section.title}</span>
        {node.rules.some((r) => r.scene) && (
          <span className={s.cube}>
            <Icon name="cube" size={13} label="יש המחשה" />
          </span>
        )}
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Node key={c.section.id} node={c} depth={depth + 1} activeSections={activeSections} onNavigate={onNavigate} />
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
          <Node key={n.section.id} node={n} depth={0} activeSections={activeSections} onNavigate={onNavigate} />
        ))}
      </ul>
    </nav>
  );
}

