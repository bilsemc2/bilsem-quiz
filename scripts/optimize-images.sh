#!/bin/bash

# Gerekli dizinleri oluştur
mkdir -p public/images/optimized

# Tüm resim dosyalarını bul ve optimize et
find public/images -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0 | while IFS= read -r -d '' file; do
    filename=$(basename "$file")
    directory=$(dirname "$file")
    optimized_dir="${directory/images/images\/optimized}"
    mkdir -p "$optimized_dir"
    
    # WebP'ye dönüştür ve optimize et
    sharp "$file" \
        --webp \
        --quality 80 \
        --output "${optimized_dir}/${filename%.*}.webp"
    
    echo "Optimized: $file -> ${optimized_dir}/${filename%.*}.webp"
done

# PNG dosyalarını WebP'ye dönüştür
for png_file in public/images/professions/*.png; do
    filename=$(basename "$png_file" .png)
    sharp -i "$png_file" -o "public/images/professions/${filename}.webp" --format webp --quality 90
    echo "Dönüştürüldü: $png_file -> ${filename}.webp"
done

echo "Optimizasyon tamamlandı!"
