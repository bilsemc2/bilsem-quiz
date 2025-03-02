#!/bin/bash

# Create necessary directories
mkdir -p public/images/questions
mkdir -p public/images/options

# Download question images
curl -L "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800" -o "public/images/questions/farm.jpg"

# Download option images
curl -L "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=500" -o "public/images/options/cow.jpg"
curl -L "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=500" -o "public/images/options/lion.jpg"
curl -L "https://images.unsplash.com/photo-1607153333879-c174d265f1d2?w=500" -o "public/images/options/dolphin.jpg"
curl -L "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=500" -o "public/images/options/eagle.jpg"
curl -L "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=500" -o "public/images/options/penguin.jpg"

echo "Quiz images downloaded successfully!"
