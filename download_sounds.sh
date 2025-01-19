#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Download sound effects
curl -L "https://github.com/codeium/public-assets/raw/main/quiz-sounds/correct.mp3" -o public/sounds/correct.mp3
curl -L "https://github.com/codeium/public-assets/raw/main/quiz-sounds/wrong.mp3" -o public/sounds/wrong.mp3
curl -L "https://github.com/codeium/public-assets/raw/main/quiz-sounds/tick.mp3" -o public/sounds/tick.mp3
curl -L "https://github.com/codeium/public-assets/raw/main/quiz-sounds/timeout.mp3" -o public/sounds/timeout.mp3
curl -L "https://github.com/codeium/public-assets/raw/main/quiz-sounds/next.mp3" -o public/sounds/next.mp3
curl -L "https://github.com/codeium/public-assets/raw/main/quiz-sounds/complete.mp3" -o public/sounds/complete.mp3
