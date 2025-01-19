// Sound effects
const correctSound = new Audio('/sounds/correct.mp3');
const incorrectSound = new Audio('/sounds/incorrect.mp3');
const timeoutSound = new Audio('/sounds/timeout.mp3');
const tickSound = new Audio('/sounds/tick.mp3');
const timeWarningSound = new Audio('/sounds/time-warning.mp3');

export function playSound(type: 'correct' | 'incorrect' | 'timeout' | 'tick' | 'timeWarning') {
    switch (type) {
        case 'correct':
            correctSound.currentTime = 0;
            correctSound.play();
            break;
        case 'incorrect':
            incorrectSound.currentTime = 0;
            incorrectSound.play();
            break;
        case 'timeout':
            timeoutSound.currentTime = 0;
            timeoutSound.play();
            break;
        case 'tick':
            tickSound.currentTime = 0;
            tickSound.play();
            break;
        case 'timeWarning':
            timeWarningSound.currentTime = 0;
            timeWarningSound.play();
            break;
    }
}

export function playTimeWarning() {
    timeWarningSound.currentTime = 0;
    timeWarningSound.play();
}
