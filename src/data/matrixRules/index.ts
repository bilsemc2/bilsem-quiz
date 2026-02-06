// Matrix Puzzle System - Kural Sistemi Ana Modülü
// Tüm kuralları birleştirir ve seçim fonksiyonları sağlar

import { MatrixRule } from '../../types/matrixRules';
import { EASY_RULES } from './easyRules';
import { MEDIUM_RULES } from './mediumRules';
import { HARD_RULES } from './hardRules';
import { EXPERT_RULES } from './expertRules';

// Re-export for backward compatibility
export { EASY_RULES } from './easyRules';
export { MEDIUM_RULES } from './mediumRules';
export { HARD_RULES } from './hardRules';
export { EXPERT_RULES } from './expertRules';

/**
 * Tüm kurallar
 */
export const ALL_RULES: MatrixRule[] = [
    ...EASY_RULES,
    ...MEDIUM_RULES,
    ...HARD_RULES,
    ...EXPERT_RULES,
];

/**
 * Seviyeye göre uygun kuralları döndürür
 * @param level Oyun seviyesi (1-20)
 * @returns Uygun zorluk seviyesindeki kurallar
 */
export function getRulesForLevel(level: number): MatrixRule[] {
    if (level <= 5) {
        return EASY_RULES;
    } else if (level <= 10) {
        return [...EASY_RULES, ...MEDIUM_RULES];
    } else if (level <= 15) {
        return [...MEDIUM_RULES, ...HARD_RULES];
    } else {
        return [...HARD_RULES, ...EXPERT_RULES];
    }
}

/**
 * Seviyeye göre rastgele bir kural seçer
 * @param level Oyun seviyesi (1-20)
 * @returns Rastgele seçilen kural
 */
export function getRandomRuleForLevel(level: number): MatrixRule {
    const rules = getRulesForLevel(level);
    return rules[Math.floor(Math.random() * rules.length)];
}

/**
 * Seviyeye göre iç ızgara kullanılıp kullanılmayacağını belirler
 * @param level Oyun seviyesi
 * @returns true ise iç ızgara kullanılmalı
 */
export function shouldUseInnerGrid(level: number): boolean {
    // Seviye 6'dan sonra iç ızgara kuralları aktif
    if (level < 6) return false;
    // Seviye arttıkça iç ızgara olasılığı artar (%10 - %100)
    return Math.random() < (level - 5) * 0.1;
}

/**
 * ID'ye göre kural bul
 * @param ruleId Kural ID'si
 * @returns Bulunan kural veya undefined
 */
export function getRuleById(ruleId: string): MatrixRule | undefined {
    return ALL_RULES.find(rule => rule.id === ruleId);
}

/**
 * Zorluk seviyesine göre kuralları filtrele
 * @param difficulty Zorluk seviyesi
 * @returns Filtrelenmiş kurallar
 */
export function getRulesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): MatrixRule[] {
    switch (difficulty) {
        case 'easy': return EASY_RULES;
        case 'medium': return MEDIUM_RULES;
        case 'hard': return HARD_RULES;
        case 'expert': return EXPERT_RULES;
    }
}
