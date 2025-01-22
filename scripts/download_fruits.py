import os
import subprocess
import requests

# Emoji indirme klasörü
DOWNLOAD_DIR = "public/images/fruits"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Twemoji base URL
BASE_URL = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg"

# Emoji kodları ve dosya adları
FRUITS = {
    "apple": "1f34e",       # 🍎 Kırmızı Elma
    "pear": "1f350",       # 🍐 Armut
    "orange": "1f34a",     # 🍊 Portakal
    "lemon": "1f34b",      # 🍋 Limon
    "banana": "1f34c",     # 🍌 Muz
    "watermelon": "1f349", # 🍉 Karpuz
    "grapes": "1f347",     # 🍇 Üzüm
    "strawberry": "1f353", # 🍓 Çilek
    "peach": "1f351",      # 🍑 Şeftali
    "cherries": "1f352",   # 🍒 Kiraz
    "pineapple": "1f34d",  # 🍍 Ananas
    "coconut": "1f965",    # 🥥 Hindistan Cevizi
}

# Her emojiyi indir
for fruit, code in FRUITS.items():
    print(f"Downloading {fruit} emoji (code: {code})...")
    
    # SVG'yi indir
    response = requests.get(f"{BASE_URL}/{code}.svg")
    svg_path = os.path.join(DOWNLOAD_DIR, f"{fruit}.svg")
    png_path = os.path.join(DOWNLOAD_DIR, f"{fruit}.png")
    
    with open(svg_path, "wb") as f:
        f.write(response.content)
    
    # SVG'yi PNG'ye çevir
    subprocess.run(["npx", "svgexport", svg_path, png_path, "64:64"])
    
    # SVG'yi sil
    os.remove(svg_path)

print("All fruit emojis downloaded and converted successfully!")
