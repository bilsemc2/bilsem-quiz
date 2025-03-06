import React from 'react';
import { Link } from 'react-router-dom';
import './BrainTrainer.css';

// Kullanılabilir beyin antrenörleri listesi
const brainActivities = [
  {
    id: 'color-grid',
    title: 'Renk Sekansı',
    description: 'Işıklı renk sekanslarını doğru sırada tekrar edin. Hafıza ve dikkat becerinizi geliştirir.',
    path: '/beyin-antrenoru/renk-sekans',
    difficulty: 'Orta',
    skills: ['Hafıza', 'Dikkat', 'Hızlı Tepki']
  },
  {
    id: 'color-perception',
    title: 'Renk Algılama',
    description: 'Kısa süreliğine görünen renkleri hızlıca algılayın ve doğru belirleyin. Algı ve tepki hızınızı artırır.',
    path: '/beyin-antrenoru/renk-algilama',
    difficulty: 'Zor',
    skills: ['Algılama', 'Hızlı Tepki', 'Odaklanma']
  }
  // İlerleyen zamanlarda yeni etkinlikler buraya eklenebilir
];

const BrainTrainer: React.FC = () => {
  return (
    <div className="brain-trainer-container">
      <div className="brain-trainer-header">
        <h1>Beyin Egzersizleri</h1>
        <p>Beyin gücünüzü geliştiren çeşitli egzersizlerle zihinsel becerilerinizi test edin ve geliştirin!</p>
      </div>

      <div className="activities-grid">
        {brainActivities.map((activity) => (
          <div key={activity.id} className="activity-card">
            <div className="activity-content">
              <h2>{activity.title}</h2>
              <p className="activity-description">{activity.description}</p>
              
              <div className="activity-meta">
                <span className="difficulty">
                  Zorluk: <strong>{activity.difficulty}</strong>
                </span>
                <div className="skills">
                  {activity.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="activity-action">
              <Link to={activity.path} className="start-activity-btn">
                Etkinliği Başlat
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      <div className="brain-trainer-info">
        <h3>Beyin Antrenörü Nedir?</h3>
        <p>
          Beyin Antrenörü, zihinsel becerilerinizi geliştirmenize yardımcı olan interaktif egzersizler
          sunarak beyin işlevlerinizi güçlendirmenizi sağlar. Düzenli kullanımla hafıza, dikkat, 
          problem çözme ve tepki süresi gibi bilişsel becerilerde gelişme sağlayabilirsiniz.
        </p>
        
        <h3>Düzenli Beyin Egzersizlerinin Faydaları</h3>
        <ul>
          <li>Hafıza kapasitesi ve hatırlama yeteneğinde artış</li>
          <li>Odaklanma süresinde uzama</li>
          <li>Daha hızlı tepki verme yeteneği</li>
          <li>Gelişmiş problem çözme becerileri</li>
          <li>Zihinsel esneklik ve adaptasyon yeteneğinde artış</li>
        </ul>
      </div>
    </div>
  );
};

export default BrainTrainer;
