import React from 'react';

export interface Profession {
  id: string;
  type: 'profession';
  value: string;
  svg: React.ReactNode;
}

interface CreateProfessionParams {
  id: string;
  value: string;
  imagePath: string;
}

const createProfession = ({
  id,
  value,
  imagePath
}: CreateProfessionParams): Profession => ({
  id,
  type: 'profession',
  value,
  svg: (
    <div className="w-16 h-16 relative flex items-center justify-center">
      <img 
        src={imagePath} 
        alt={value}
        width={64}
        height={64}
        className="object-contain"
      />
    </div>
  ),
});

export const professions: Profession[] = [
  createProfession({ id: 'doctor', value: 'Doktor', imagePath: '/images/professions/doctor.png' }),
  createProfession({ id: 'teacher', value: 'Öğretmen', imagePath: '/images/professions/teacher.png' }),
  createProfession({ id: 'chef', value: 'Aşçı', imagePath: '/images/professions/chef.png' }),
  createProfession({ id: 'scientist', value: 'Bilim İnsanı', imagePath: '/images/professions/scientist.png' }),
  createProfession({ id: 'farmer', value: 'Çiftçi', imagePath: '/images/professions/farmer.png' }),
  createProfession({ id: 'mechanic', value: 'Tamirci', imagePath: '/images/professions/mechanic.png' }),
  createProfession({ id: 'artist', value: 'Sanatçı', imagePath: '/images/professions/artist.png' }),
  createProfession({ id: 'firefighter', value: 'İtfaiyeci', imagePath: '/images/professions/firefighter.png' }),
  createProfession({ id: 'pilot', value: 'Pilot', imagePath: '/images/professions/pilot.png' }),
  createProfession({ id: 'astronaut', value: 'Astronot', imagePath: '/images/professions/astronaut.png' }),
  createProfession({ id: 'police', value: 'Polis', imagePath: '/images/professions/police.png' }),
  createProfession({ id: 'construction', value: 'İnşaat İşçisi', imagePath: '/images/professions/construction.png' }),
];
