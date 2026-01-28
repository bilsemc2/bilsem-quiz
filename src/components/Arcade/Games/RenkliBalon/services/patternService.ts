import { Pattern, Difficulty } from "../types";

const COLORS = ['#FF5F5D', '#3F7C85', '#72F2EB', '#FFD166', '#06D6A0', '#EF476F'];

export const generateLocalPattern = (difficulty: Difficulty): Pattern => {
    const length = 5;
    const start = Math.floor(Math.random() * 10) + 1;
    let step = Math.floor(Math.random() * 5) + 1;
    const sequence: (number | string)[] = [];
    let answer: number = 0;
    let rule = "";

    if (difficulty === Difficulty.EASY) {
        rule = `Artış: +${step}`;
        for (let i = 0; i < length; i++) {
            sequence.push(start + i * step);
        }
    } else if (difficulty === Difficulty.MEDIUM) {
        step = Math.floor(Math.random() * 10) + 2;
        rule = `Artış: +${step}`;
        for (let i = 0; i < length; i++) {
            sequence.push(start + i * step);
        }
    } else {
        const type = Math.random() > 0.5 ? 'mult' : 'alt';
        if (type === 'mult') {
            step = 2;
            rule = `Çarpma: x${step}`;
            for (let i = 0; i < length; i++) {
                sequence.push(start * Math.pow(step, i));
            }
        } else {
            rule = "Alternatif: +2, -1";
            for (let i = 0; i < length; i++) {
                sequence.push(i % 2 === 0 ? start + (i / 2) * 1 : start + 2 + Math.floor(i / 2) * 1);
            }
        }
    }

    const missingIndex = Math.floor(Math.random() * (length - 1)) + 1;
    answer = sequence[missingIndex] as number;
    sequence[missingIndex] = "?";

    const options = new Set<number>([answer]);
    while (options.size < 4) {
        const offset = Math.floor(Math.random() * 10) - 5;
        if (offset !== 0) {
            options.add(Math.abs(answer + offset));
        }
    }

    return {
        sequence,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        rule,
        targetColor: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
};
