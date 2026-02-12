import { Card } from '@/shared/ui/Card';

import { FAQ_ITEMS } from '@/features/content/data/faq';

function groupByCategory() {
  const map = new Map<string, typeof FAQ_ITEMS>();

  FAQ_ITEMS.forEach((item) => {
    const items = map.get(item.category) ?? [];
    map.set(item.category, [...items, item]);
  });

  return Array.from(map.entries());
}

export function FaqContent() {
  const groupedItems = groupByCategory();

  return (
    <div className="stack">
      {groupedItems.map(([category, items]) => (
        <Card key={category} title={category}>
          <div className="stack-sm">
            {items.map((item) => (
              <details
                key={item.question}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '0.6rem 0.75rem',
                  background: '#f8fafc',
                }}
              >
                <summary style={{ fontWeight: 600, cursor: 'pointer' }}>{item.question}</summary>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
