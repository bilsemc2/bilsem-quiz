#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p public/sounds

# Download sound effects
curl -L "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" -o "public/sounds/correct.mp3"
curl -L "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3" -o "public/sounds/incorrect.mp3"
curl -L "https://assets.mixkit.co/active_storage/sfx/2868/2868-preview.mp3" -o "public/sounds/tick.mp3"
curl -L "https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3" -o "public/sounds/time-warning.mp3"

echo "Sound effects downloaded successfully!"
