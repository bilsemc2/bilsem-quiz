import os
import subprocess
import requests

# Emoji indirme klasörü
DOWNLOAD_DIR = "public/images/animals"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Twemoji base URL
BASE_URL = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg"

# Emoji kodları ve dosya adları
EMOJIS = {
    "cat": "1f408",        # 🐈
    "dog": "1f415",        # 🐕
    "bird": "1f426",       # 🐦
    "rabbit": "1f407",     # 🐇
    "fish": "1f41f",       # 🐟
    "butterfly": "1f98b",   # 🦋
    "owl": "1f989",        # 🦉
    "elephant": "1f418",    # 🐘
    "penguin": "1f427",    # 🐧
    "lion": "1f981",       # 🦁
    "giraffe": "1f992",    # 🦒
    "monkey": "1f412"      # 🐒
}

# Her emojiyi indir
for animal, code in EMOJIS.items():
    print(f"Downloading {animal} emoji (code: {code})...")
    
    # SVG'yi indir
    response = requests.get(f"{BASE_URL}/{code}.svg")
    svg_path = os.path.join(DOWNLOAD_DIR, f"{animal}.svg")
    png_path = os.path.join(DOWNLOAD_DIR, f"{animal}.png")
    
    with open(svg_path, "wb") as f:
        f.write(response.content)
    
    # SVG'yi PNG'ye çevir
    subprocess.run(["npx", "svgexport", svg_path, png_path, "64:64"])
    
    # SVG'yi sil
    os.remove(svg_path)

print("All emojis downloaded and converted successfully!")
