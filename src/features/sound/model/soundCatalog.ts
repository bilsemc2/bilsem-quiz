export type AppSoundName =
    | 'correct' | 'incorrect' | 'tick' | 'timeWarning' | 'select' | 'pop' | 'complete' | 'slide' | 'shing'
    | 'cosmic_pop' | 'cosmic_success' | 'cosmic_fail'
    | 'radar_beep' | 'radar_scan' | 'radar_warning' | 'radar_correct' | 'radar_incorrect'
    | 'detective_click' | 'detective_mystery' | 'detective_clue' | 'detective_correct' | 'detective_incorrect'
    | 'memory_flip' | 'memory_match' | 'memory_fail' | 'memory_shuffle'
    | 'signal_appear' | 'signal_disappear' | 'signal_correct' | 'signal_wrong'
    | 'grid_flip' | 'grid_match' | 'grid_fail' | 'grid_error'
    | 'flow_next' | 'flow_correct' | 'flow_wrong' | 'flow_splash'
    | 'success' | 'wrong' | 'click';

export const SOUND_URLS: Record<AppSoundName, string> = {
    correct: '/sounds/correct.mp3',
    incorrect: '/sounds/incorrect.mp3',
    tick: '/sounds/tick.mp3',
    timeWarning: '/sounds/time-warning.mp3',
    select: '/sounds/select.mp3',
    pop: '/sounds/pop.mp3',
    complete: '/sounds/complete.mp3',
    slide: '/sounds/select.mp3',
    shing: '/sounds/pop.mp3',
    success: '/sounds/correct.mp3',
    wrong: '/sounds/incorrect.mp3',
    click: '/sounds/select.mp3',
    cosmic_pop: '/sounds/pop.mp3',
    cosmic_success: '/sounds/levelUp.mp3',
    cosmic_fail: '/sounds/wrong.mp3',
    radar_beep: '/sounds/select.mp3',
    radar_scan: '/sounds/tick.mp3',
    radar_warning: '/sounds/time-warning.mp3',
    radar_correct: '/sounds/correct.mp3',
    radar_incorrect: '/sounds/incorrect.mp3',
    detective_click: '/sounds/pop.mp3',
    detective_mystery: '/sounds/tick.mp3',
    detective_clue: '/sounds/next.mp3',
    detective_correct: '/sounds/correct.mp3',
    detective_incorrect: '/sounds/incorrect.mp3',
    memory_flip: '/sounds/select.mp3',
    memory_match: '/sounds/correct.mp3',
    memory_fail: '/sounds/incorrect.mp3',
    memory_shuffle: '/sounds/tick.mp3',
    signal_appear: '/sounds/pop.mp3',
    signal_disappear: '/sounds/tick.mp3',
    signal_correct: '/sounds/correct.mp3',
    signal_wrong: '/sounds/incorrect.mp3',
    grid_flip: '/sounds/select.mp3',
    grid_match: '/sounds/correct.mp3',
    grid_fail: '/sounds/incorrect.mp3',
    grid_error: '/sounds/time-warning.mp3',
    flow_next: '/sounds/pop.mp3',
    flow_correct: '/sounds/correct.mp3',
    flow_wrong: '/sounds/incorrect.mp3',
    flow_splash: '/sounds/next.mp3'
};
