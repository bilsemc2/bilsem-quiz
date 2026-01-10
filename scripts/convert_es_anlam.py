#!/usr/bin/env python3
import re
import json
import sys

# Read entire SQL file
with open('/Users/yetenekvezeka/Downloads/test_questions_rows.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all coktan_secmeli_es_anlam entries
# Pattern: ('uuid', 'kelime', '[options]', 'correct', 'coktan_secmeli_es_anlam', 'date')
pattern = r"\('[^']+', '([^']+)', '\[([^\]]+)\]', '([a-d])', 'coktan_secmeli_es_anlam', '[^']+'\)"

inserts = []
for match in re.finditer(pattern, content):
    kelime = match.group(1).replace("'", "''")
    options_str = '[' + match.group(2) + ']'
    correct_answer = match.group(3)
    
    try:
        # Fix escaped quotes in JSON
        options_str = options_str.replace('\\"', '"')
        options = json.loads(options_str)
        
        secenek_a = ''
        secenek_b = ''
        secenek_c = ''
        secenek_d = ''
        es_anlami = ''
        
        for opt in options:
            text = opt['text'].replace("'", "''")
            if opt['id'] == 'a':
                secenek_a = text
                if correct_answer == 'a':
                    es_anlami = text
            elif opt['id'] == 'b':
                secenek_b = text
                if correct_answer == 'b':
                    es_anlami = text
            elif opt['id'] == 'c':
                secenek_c = text
                if correct_answer == 'c':
                    es_anlami = text
            elif opt['id'] == 'd':
                secenek_d = text
                if correct_answer == 'd':
                    es_anlami = text
        
        if secenek_a and secenek_b and secenek_c and secenek_d:
            insert = f"('{kelime}', '{secenek_a}', '{secenek_b}', '{secenek_c}', '{secenek_d}', '{correct_answer}', '{es_anlami}', 'orta')"
            inserts.append(insert)
    except Exception as e:
        print(f"-- Error parsing: {e}", file=sys.stderr)
        continue

print(f"-- {len(inserts)} eş anlam sorusu aktarıldı")
print()
print("INSERT INTO es_anlam_sorulari (kelime, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, es_anlami, zorluk) VALUES")
print(',\n'.join(inserts) + ';')
