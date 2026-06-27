import zipfile, re, sys, json, os
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

script_dir = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(script_dir, 'Đề leo đỉnh 10 - GV.docx')

with zipfile.ZipFile(path) as z:
    with z.open('word/document.xml') as f:
        xml = f.read().decode('utf-8')

def get_paras(xml):
    return re.findall(r'<w:p[ >][\s\S]*?</w:p>', xml)

def parse_omath_element(elem):
    tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
    if tag == 'oMath':
        return ''.join(parse_omath_element(c) for c in elem)
    elif tag == 'fName':
        name = ''.join(parse_omath_element(c) for c in elem).strip()
        if name in ['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan', 'log', 'ln', 'lim', 'max', 'min']:
            return f"\\{name} "
        return name
    elif tag == 'r':
        t_texts = []
        for child in elem.iter():
            ctag = child.tag.split('}')[-1]
            if ctag == 't':
                t_texts.append(child.text or '')
        return ''.join(t_texts)
    elif tag == 'd':
        beg, end = '(', ')'
        dPr = next((c for c in elem if c.tag.split('}')[-1] == 'dPr'), None)
        if dPr is not None:
            begChr = next((c for c in dPr if c.tag.split('}')[-1] == 'begChr'), None)
            if begChr is not None:
                beg = begChr.get('{http://schemas.openxmlformats.org/officeDocument/2006/math}val') or begChr.get('val') or '('
            endChr = next((c for c in dPr if c.tag.split('}')[-1] == 'endChr'), None)
            if endChr is not None:
                end = endChr.get('{http://schemas.openxmlformats.org/officeDocument/2006/math}val') or endChr.get('val') or ')'
        e = next((c for c in elem if c.tag.split('}')[-1] == 'e'), None)
        inner = parse_omath_element(e) if e is not None else ''
        return f"{beg}{inner}{end}"
    elif tag == 'acc':
        accentChar = '⃗'
        accPr = next((c for c in elem if c.tag.split('}')[-1] == 'accPr'), None)
        if accPr is not None:
            chr_node = next((c for c in accPr if c.tag.split('}')[-1] == 'chr'), None)
            if chr_node is not None:
                accentChar = chr_node.get('{http://schemas.openxmlformats.org/officeDocument/2006/math}val') or chr_node.get('val') or '⃗'
        e = next((c for c in elem if c.tag.split('}')[-1] == 'e'), None)
        inner = parse_omath_element(e) if e is not None else ''
        if accentChar in ['⃗', '\u20d7', '→']:
            return f"\\vec{{{inner}}}"
        return inner
    elif tag == 'f':
        numNode = next((c for c in elem if c.tag.split('}')[-1] == 'num'), None)
        denNode = next((c for c in elem if c.tag.split('}')[-1] == 'den'), None)
        num = parse_omath_element(numNode) if numNode is not None else ''
        den = parse_omath_element(denNode) if denNode is not None else ''
        return f"\\frac{{{num}}}{{{den}}}"
    elif tag in ['sSub', 'sSup', 'sSubSup']:
        eNode = next((c for c in elem if c.tag.split('}')[-1] == 'e'), None)
        subNode = next((c for c in elem if c.tag.split('}')[-1] == 'sub'), None)
        supNode = next((c for c in elem if c.tag.split('}')[-1] == 'sup'), None)
        base = parse_omath_element(eNode) if eNode is not None else ''
        sub = parse_omath_element(subNode) if subNode is not None else ''
        sup = parse_omath_element(supNode) if supNode is not None else ''
        res = base
        if sub: res += f"_{{{sub}}}"
        if sup: res += f"^{{{sup}}}"
        return res
    elif tag == 'nary':
        subNode = next((c for c in elem if c.tag.split('}')[-1] == 'sub'), None)
        supNode = next((c for c in elem if c.tag.split('}')[-1] == 'sup'), None)
        eNode = next((c for c in elem if c.tag.split('}')[-1] == 'e'), None)
        sub = parse_omath_element(subNode) if subNode is not None else ''
        sup = parse_omath_element(supNode) if supNode is not None else ''
        inner = parse_omath_element(eNode) if eNode is not None else ''
        return f"\\int_{{{sub}}}^{{{sup}}} {inner}"
    elif tag == 'bar':
        eNode = next((c for c in elem if c.tag.split('}')[-1] == 'e'), None)
        inner = parse_omath_element(eNode) if eNode is not None else ''
        return f"\\bar{{{inner}}}"
    else:
        return ''.join(parse_omath_element(c) for c in elem)

def get_text(para, tabs=False):
    parts = []
    for tok in re.split(r'(<w:r[ >][\s\S]*?</w:r>|<m:oMath>[\s\S]*?</m:oMath>)', para):
        if not tok: continue
        if tok.startswith('<w:r'):
            if tabs and '<w:tab/>' in tok: parts.append('\t')
            parts += re.findall(r'<w:t[^>]*>([\s\S]*?)</w:t>', tok)
        elif tok.startswith('<m:oMath'):
            try:
                root = ET.fromstring(f'<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">{tok}</root>')
                omath = root[0]
                parts.append(parse_omath_element(omath))
            except Exception as e:
                mt = re.findall(r'<m:t[^>]*>([\s\S]*?)</m:t>', tok)
                if mt: parts.append(''.join(mt))
    return ''.join(parts)

def get_color(p): m = re.search(r'<w:color w:val="([^"]+)"', p); return m.group(1).upper() if m else ''
def get_hl(p):    m = re.search(r'<w:highlight w:val="([^"]+)"', p); return m.group(1) if m else ''

def parse_choices(raw):
    parts = [s.strip() for s in raw.split('\t') if s.strip()]
    choices = []
    for part in parts:
        m = re.match(r'^([A-D])\.\s*(.*)', part)
        if m:
            choices.append({'key': m.group(1), 'text': m.group(2).rstrip('. ').strip()})
    if not choices:
        for m in re.finditer(r'\b([A-D])\.\s*([\s\S]*?)(?=\s*\b[A-D]\.\s|$)', raw):
            t = m.group(2).replace('\s+',' ').strip().rstrip('.')
            if t: choices.append({'key': m.group(1), 'text': t})
    return choices

def parse_answer(text, section='I'):
    m = re.search(r'(?:Lời\s+giải|Trả\s+lời|Đáp\s+án)\s*[:\-]?\s*(.+)', text, re.IGNORECASE)
    if not m: return None
    raw = m.group(1).strip()
    
    if section == 'III':
        num_m = re.match(r'^(-?\d+(?:[.,]\d+)?)(.*)', raw)
        if num_m:
            return {'type': 'short', 'val': num_m.group(1).strip(), 'rest': num_m.group(2).strip()}
        return {'type': 'short', 'val': raw, 'rest': ''}

    if re.match(r'^[A-D]$', raw, re.I): return {'type':'abcd','val':raw.upper()}
    if re.search(r'[SĐ]', raw): return {'type':'tf','vals': [s.strip() for s in raw.split('-') if s.strip()]}
    return {'type':'abcd','val':raw.upper()}

paras = get_paras(xml)
questions = []
section = 'I'
i = 0

while i < len(paras):
    p = paras[i]
    color = get_color(p)
    hl    = get_hl(p)
    text  = get_text(p)

    if re.search(r'Phần\s+II\b', text, re.I):
        section = 'II'; i += 1; continue
    if re.search(r'Phần\s+III\b', text, re.I):
        section = 'III'; i += 1; continue
    if re.search(r'Phần\s+I\b', text, re.I) and not re.search(r'Phần\s+II', text, re.I):
        section = 'I'; i += 1; continue

    if (color == '0000FF' or color == '000000') and re.match(r'^\s*Câu\s+\d+', text, re.I):
        num_m = re.search(r'Câu\s+(\d+)', text, re.I)
        tag_m = re.search(r'\[([^\]]+)\]', text)
        qtext = re.sub(r'^Câu\s+\d+[\s.:]+', '', text, flags=re.I)
        qtext = re.sub(r'^\[[^\]]+\]\s*', '', qtext).strip()
        
        block = {'num': int(num_m.group(1)), 'tag': tag_m.group(1) if tag_m else None,
                 'section': section, 'qtext': qtext, 'choices': [], 'answer': None, 'solution': []}
        i += 1
        while i < len(paras):
            cur     = paras[i]
            cc      = get_color(cur)
            ch      = get_hl(cur)
            ct_tab  = get_text(cur, tabs=True)
            ct      = get_text(cur)
            
            if re.search(r'Phần\s+(?:I|II|III)\b', ct, re.I): break
            if (cc == '0000FF' or cc == '000000') and re.match(r'^\s*Câu\s+\d+', ct, re.I): break
            
            if cc == 'C00000':
                block['choices'] += parse_choices(ct_tab)
            elif ch == 'yellow':
                block['answer'] = parse_answer(ct, section)
            elif ct.strip():
                if block['choices'] or block['answer']:
                    block['solution'].append(ct.strip())
                else:
                    block['qtext'] += ' ' + ct.strip()
            i += 1
        questions.append(block)
    else:
        i += 1

print(f"Total questions: {len(questions)}\n")
for q in questions:
    section_str = q['section']
    ans = q['answer']
    ans_str = ans['val'] if ans and ans['type'] in ('abcd', 'short') else ('-'.join(ans['vals']) if ans else 'N/A')
    print(f"[P{section_str}] Câu {q['num']} | Ans={ans_str} | {len(q['choices'])} choices | {len(q['solution'])} sol lines")
    print(f"       Q: {q['qtext'][:80]}")
    for c in q['choices']:
        mark = ' <-- CORRECT' if (ans and ans.get('val') == c['key']) else ''
        print(f"       {c['key']}. {c['text'][:60]}{mark}")
    if q['solution']:
        print(f"       Sol: {q['solution'][0][:70]}")
    print()

out_path = os.path.join(script_dir, 'quiz_final.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
print("Saved to quiz_final.json")
