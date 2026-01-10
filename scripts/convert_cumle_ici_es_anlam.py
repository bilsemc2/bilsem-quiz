#!/usr/bin/env python3
"""
cumle_ici_es_anlam_bulma sorularını SQL INSERT formatına dönüştürür
"""
import re
import json

def extract_questions(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Tüm INSERT değerlerini çıkar - cumle_ici_es_anlam_bulma olanları filtrele
    # Pattern: ('uuid', 'text', '[options]', 'answer', 'cumle_ici_es_anlam_bulma', 'timestamp')
    pattern = r"\('([^']+)',\s*'((?:[^']|'')+)',\s*'\[((?:[^\]]|(?<=\\)\])*)\]',\s*'([a-d])',\s*'cumle_ici_es_anlam_bulma',\s*'[^']+'\)"
    
    matches = re.findall(pattern, content, re.DOTALL)
    
    questions = []
    for match in matches:
        try:
            uuid, cumle, options_str, correct_answer = match
            
            # Cümle temizle
            cumle = cumle.replace("''", "'").strip()
            
            # "cümlesindeki" içermeyen soruları atla
            if "cümlesindeki" not in cumle:
                continue
            
            # JSON'u parse et (escape'leri düzelt)
            options_str = options_str.replace('\\"', '"')
            try:
                options = json.loads('[' + options_str + ']')
            except:
                continue
            
            # Seçenekleri çıkar
            secenek_a = secenek_b = secenek_c = secenek_d = dogru_kelime = ""
            
            for opt in options:
                text = opt['text'].replace("'", "''")
                if opt['id'] == 'a':
                    secenek_a = text
                    if correct_answer == 'a':
                        dogru_kelime = text
                elif opt['id'] == 'b':
                    secenek_b = text
                    if correct_answer == 'b':
                        dogru_kelime = text
                elif opt['id'] == 'c':
                    secenek_c = text
                    if correct_answer == 'c':
                        dogru_kelime = text
                elif opt['id'] == 'd':
                    secenek_d = text
                    if correct_answer == 'd':
                        dogru_kelime = text
            
            # Tüm seçenekler ve doğru kelime varsa ekle
            if secenek_a and secenek_b and secenek_c and secenek_d and dogru_kelime:
                # Cümle SQL için escape
                cumle_escaped = cumle.replace("'", "''")
                questions.append({
                    'cumle': cumle_escaped,
                    'secenek_a': secenek_a,
                    'secenek_b': secenek_b,
                    'secenek_c': secenek_c,
                    'secenek_d': secenek_d,
                    'dogru_cevap': correct_answer,
                    'dogru_kelime': dogru_kelime
                })
        except Exception as e:
            continue
    
    return questions

def generate_sql(questions):
    print(f"-- {len(questions)} cümle içi eş anlam sorusu aktarıldı")
    print()
    print("INSERT INTO cumle_ici_es_anlam_sorulari (cumle, secenek_a, secenek_b, secenek_c, secenek_d, dogru_cevap, dogru_kelime, zorluk) VALUES")
    
    values = []
    for q in questions:
        value = f"('{q['cumle']}', '{q['secenek_a']}', '{q['secenek_b']}', '{q['secenek_c']}', '{q['secenek_d']}', '{q['dogru_cevap']}', '{q['dogru_kelime']}', 'orta')"
        values.append(value)
    
    print(",\n".join(values) + ";")

if __name__ == "__main__":
    questions = extract_questions("/Users/yetenekvezeka/Downloads/test_questions_rows.sql")
    generate_sql(questions)
