#!/bin/bash

# Emoji indirme klasörü
DOWNLOAD_DIR="public/images/animals"
mkdir -p $DOWNLOAD_DIR

# Twemoji base URL
BASE_URL="https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg"

# Emoji kodları ve dosya adları
declare -A EMOJIS=(
    ["cat"]="1f408"        # 🐈
    ["dog"]="1f415"        # 🐕
    ["bird"]="1f426"       # 🐦
    ["rabbit"]="1f407"     # 🐇
    ["fish"]="1f41f"       # 🐟
    ["butterfly"]="1f98b"   # 🦋
    ["owl"]="1f989"        # 🦉
    ["elephant"]="1f418"    # 🐘
    ["penguin"]="1f427"    # 🐧
    ["lion"]="1f981"       # 🦁
    ["giraffe"]="1f992"    # 🦒
    ["monkey"]="1f412"     # 🐒
)

# Her emojiyi indir
for animal in "${!EMOJIS[@]}"; do
    code=${EMOJIS[$animal]}
    echo "Downloading $animal emoji (code: $code)..."
    curl -o "$DOWNLOAD_DIR/$animal.svg" "$BASE_URL/$code.svg"
    # SVG'yi PNG'ye çevir
    npx svgexport "$DOWNLOAD_DIR/$animal.svg" "$DOWNLOAD_DIR/$animal.png" 64:64
done

# SVG dosyalarını sil
rm $DOWNLOAD_DIR/*.svg

echo "All emojis downloaded and converted successfully!"
