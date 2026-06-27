import zipfile, re, sys, json
sys.stdout.reconfigure(encoding='utf-8')

import os
script_dir = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(script_dir, 'Đề leo đỉnh 10 - GV.docx')
with zipfile.ZipFile(path) as z:
    with z.open('word/document.xml') as f:
        content = f.read().decode('utf-8')

text = re.sub(r'<[^>]+>', ' ', content)
text = re.sub(r'\s+', ' ', text)

chunks = re.split(r'(?=Câu\s+\d+[\s.])', text)
chunks = [c.strip() for c in chunks if re.search(r'Câu\s+\d+', c)]

print("Total chunks:", len(chunks))

def parse_chunk(chunk):
    num_m = re.search(r'Câu\s+(\d+)', chunk)
    if not num_m: return None
    num = int(num_m.group(1))
    
    rest = chunk[num_m.end():].lstrip(' .')
    
    # Tag
    tag_m = re.match(r'\[([^\]]+)\]\s*', rest)
    tag = tag_m.group(1) if tag_m else None
    if tag_m: rest = rest[tag_m.end():]
    
    # Find answer (last occurrence)
    ans_m_all = list(re.finditer(r'Lời\s+giải\s*[:\-]?\s*([A-D])\b', rest))
    answer = ans_m_all[-1].group(1) if ans_m_all else None
    
    # Solution text (after the answer letter)
    solution = ''
    if ans_m_all:
        last = ans_m_all[-1]
        sol_after = rest[last.end():].strip()
        # Remove next question if leaked
        sol_after = re.split(r'Câu\s+\d+', sol_after)[0]
        solution = sol_after.strip()
    
    # Truncate rest at first "Lời giải" to get question + choices
    loi_giai_pos = re.search(r'Lời\s+giải', rest)
    body = rest[:loi_giai_pos.start()].strip() if loi_giai_pos else rest
    
    # Find choices A. B. C. D.
    first_a = re.search(r'\bA\.\s', body)
    q_text = body[:first_a.start()].strip() if first_a else body
    q_text = re.sub(r'\s+', ' ', q_text).strip()
    
    choices = []
    choice_matches = list(re.finditer(r'\b([A-D])\.\s*(.*?)(?=\s+\b[A-D]\.\s|$)', body))
    for m in choice_matches:
        key = m.group(1)
        val = re.sub(r'\s+', ' ', m.group(2)).strip()
        # Remove trailing punctuation
        val = val.rstrip('. ')
        if val:
            choices.append({'key': key, 'text': val})
    
    return {"num": num, "tag": tag, "question": q_text, "answer": answer, "choices": choices, "solution": solution}

questions = [parse_chunk(c) for c in chunks]
questions = [q for q in questions if q]

print(f"\nExtracted {len(questions)} questions\n")
for q in questions[:3]:
    print(f"Cau {q['num']} | Answer={q['answer']}")
    print(f"  Q: {q['question'][:80]}")
    for c in q['choices']:
        mark = " <-- CORRECT" if c['key'] == q['answer'] else ""
        print(f"  {c['key']}. {c['text'][:50]}{mark}")
    print(f"  Solution: {q['solution'][:60]}")
    print()

out_path = os.path.join(script_dir, 'quiz_output.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
print("Saved to quiz_output.json")
