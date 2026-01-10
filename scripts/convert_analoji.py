#!/usr/bin/env python3
import re
import json

# Read raw analogy data
with open('/tmp/analoji_raw.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to extract data
pattern = r"\('[^']+', '([^']+)', '\[([^\]]+)\]', '([a-d])', 'analoji_sorusu', '[^']+'\)"

inserts = []
for match in re.finditer(pattern, content):
    question = match.group(1)
    options_json = '[' + match.group(2) + ']'
    correct_answer = match.group(3)
    
    # Parse options
    try:
        options_json = options_json.replace('\\"', '"')
        options = json.loads(options_json)
        
        secenek_a = ''
        secenek_b = ''
        secenek_c = ''
        secenek_d = ''
        
        for opt in options:
            if opt['id'] == 'a':
                secenek_a = opt['text'].replace("'", "''")
            elif opt['id'] == 'b':
                secenek_b = opt['text'].replace("'", "''")
            elif opt['id'] == 'c':
                secenek_c = opt['text'].replace("'", "''")
            elif opt['id'] == 'd':
                secenek_d = opt['text'].replace("'", "''")
        
        question = question.replace("'", "''")
        
        insert = f"('{question}', '{secenek_a}', '{secenek_b}', '{secenek_c}', '{secenek_d}', '{correct_answer}', NULL, 'orta')"
        inserts.append(insert)
    except Exception as e:
        print(f"Error parsing: {e}")
        continue

print(f"-- {len(inserts)} analoji sorusu aktarıldı")
print()
print("INSERT INTO analoji_sorulari (soru_metni, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, aciklama, zorluk) VALUES")
print(',\n'.join(inserts) + ';')
