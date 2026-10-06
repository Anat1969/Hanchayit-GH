import type { SectionNode } from '../rules/derive.ts';
import { Icon } from './icons.tsx';
import s from './Index.module.css';

function Node({ node, activeSections, selected, onSection, onScene }: {
  node: SectionNode;
  activeSections: Set<string>;
  selected: string | null;
  onSection: (sectionId: string) => void;
  onScene: (sectionId: string) => void;
}) {
  const { section } = node;
  const active = activeSections.has(section.id);
  const scene = node.rules.some((r) => r.scene);
  return (
    <li>
      <div className={s.row} data-selected={selected === section.id || undefined}>
        <button
          type="button"
          className={s.item}
          aria-current={active ? 'location' : undefined}
          onClick={() => onSection(section.id)}
        >
          {section.ref && <span className={s.ref}>{section.ref}</span>}
          <span className={s.title}>{section.title}</span>
        </button>
        {scene && (
          <button
            type="button"
            className={s.cube}
            aria-label={`להמחשה של ${section.title}`}
            title="להמחשה ולסעיף שלה"
            onClick={() => onScene(section.id)}
          >
            <Icon name="cube" size={14} />
          </button>
        )}
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <Node key={c.section.id} node={c} activeSections={activeSections} selected={selected} onSection={onSection} onScene={onScene} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Index({ tree, activeSections, selected, onSection, onScene }: {
  tree: SectionNode[];
  activeSections: Set<string>;
  selected: string | null;
  onSection: (sectionId: string) => void;
  onScene: (sectionId: string) => void;
}) {
  return (
    <nav className={s.index} aria-label="תוכן עניינים">
      <ul>
        {tree.map((n) => (
          <Node key={n.section.id} node={n} activeSections={activeSections} selected={selected} onSection={onSection} onScene={onScene} />
        ))}
      </ul>
    </nav>
  );
}

