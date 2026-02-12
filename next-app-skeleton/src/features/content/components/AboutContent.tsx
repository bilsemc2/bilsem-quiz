import { Card } from '@/shared/ui/Card';

import { ABOUT_EXPERIENCES, ABOUT_METHOD_ITEMS, ABOUT_PROFILE } from '@/features/content/data/about';

export function AboutContent() {
  return (
    <div className="stack">
      <Card title={`${ABOUT_PROFILE.name} - ${ABOUT_PROFILE.title}`}>
        <p>{ABOUT_PROFILE.intro}</p>
      </Card>

      <div className="grid-2">
        <Card title="Deneyim">
          <ul>
            {ABOUT_EXPERIENCES.map((item) => (
              <li key={item.title}>
                <strong>{item.title}:</strong> {item.detail}
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Egitim Metodu">
          <ul>
            {ABOUT_METHOD_ITEMS.map((item) => (
              <li key={item.title}>
                <strong>{item.title}:</strong> {item.detail}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Calisma Yaklasimi">
        <p>
          BilsemC2, surece hem veli hem egitmen perspektifiyle yaklasir. Amac; ogrencinin eksik alanlarini
          erken fark edip duzenli bir planla guclendirmektir.
        </p>
      </Card>
    </div>
  );
}
