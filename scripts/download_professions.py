import os
import subprocess
import requests

# Emoji indirme klasörü
DOWNLOAD_DIR = "public/images/professions"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Twemoji base URL
BASE_URL = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg"

# Emoji kodları ve dosya adları
PROFESSIONS = {
    "doctor": "1f469-200d-2695-fe0f",      # 👩‍⚕️ Doctor
    "teacher": "1f469-200d-1f3eb",         # 👩‍🏫 Teacher
    "chef": "1f469-200d-1f373",            # 👩‍🍳 Chef
    "scientist": "1f469-200d-1f52c",       # 👩‍🔬 Scientist
    "farmer": "1f469-200d-1f33e",          # 👩‍🌾 Farmer
    "mechanic": "1f469-200d-1f527",        # 👩‍🔧 Mechanic
    "artist": "1f469-200d-1f3a8",          # 👩‍🎨 Artist
    "firefighter": "1f469-200d-1f692",     # 👩‍🚒 Firefighter
    "pilot": "1f469-200d-2708-fe0f",       # 👩‍✈️ Pilot
    "astronaut": "1f469-200d-1f680",       # 👩‍🚀 Astronaut
    "police": "1f46e-200d-2640-fe0f",      # 👮‍♀️ Police Officer
    "construction": "1f477-200d-2640-fe0f", # 👷‍♀️ Construction Worker
}

# Her emojiyi indir
for profession, code in PROFESSIONS.items():
    print(f"Downloading {profession} emoji (code: {code})...")
    
    # SVG'yi indir
    response = requests.get(f"{BASE_URL}/{code}.svg")
    svg_path = os.path.join(DOWNLOAD_DIR, f"{profession}.svg")
    png_path = os.path.join(DOWNLOAD_DIR, f"{profession}.png")
    
    with open(svg_path, "wb") as f:
        f.write(response.content)
    
    # SVG'yi PNG'ye çevir
    subprocess.run(["npx", "svgexport", svg_path, png_path, "64:64"])
    
    # SVG'yi sil
    os.remove(svg_path)

print("All profession emojis downloaded and converted successfully!")
