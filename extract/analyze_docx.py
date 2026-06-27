import zipfile, re, sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'd:\extract\Đề leo đỉnh 10 - GV.docx'

with zipfile.ZipFile(path) as z:
    with z.open('word/document.xml') as f:
        raw_xml = f.read().decode('utf-8')

paragraphs = re.findall(r'<w:p[ >].*?</w:p>', raw_xml, re.DOTALL)

def extract_all_text(para_xml):
    """Extract text including OMML math (m:t tags) and tabs"""
    parts = []
    # Process each run/math element in order
    # Split into tokens: <w:r>, <m:oMath>, <w:tab>
    tokens = re.split(r'(<w:r[ >].*?</w:r>|<m:oMath>.*?</m:oMath>)', para_xml, flags=re.DOTALL)
    
    for tok in tokens:
        if tok.startswith('<w:r'):
            # Regular run: get tabs + text
            if '<w:tab/>' in tok:
                parts.append('\t')
            texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', tok, re.DOTALL)
            parts.extend(texts)
        elif tok.startswith('<m:oMath'):
            # Math: extract m:t text elements
            math_texts = re.findall(r'<m:t[^>]*>(.*?)</m:t>', tok, re.DOTALL)
            if math_texts:
                parts.append(''.join(math_texts))
    
    return ''.join(parts)

def get_color(para_xml):
    m = re.search(r'<w:color w:val="([^"]+)"', para_xml)
    return m.group(1) if m else ''

def get_highlight(para_xml):
    m = re.search(r'<w:highlight w:val="([^"]+)"', para_xml)
    return m.group(1) if m else ''

print("=== CHOICE PARAGRAPHS WITH MATH ===\n")
for i, p in enumerate(paragraphs[:120]):
    color = get_color(p)
    hl    = get_highlight(p)
    
    if color == 'C00000':
        text = extract_all_text(p)
        print(f"P{i:03d} [CHOICES] | {repr(text[:200])}")
        print()

print("\n=== FULL SEQUENCE WITH MATH ===\n")
for i, p in enumerate(paragraphs[:160]):
    text  = extract_all_text(p).strip()
    color = get_color(p)
    hl    = get_highlight(p)
    if not text: continue
    
    if hl == 'yellow':      tag = '[ANSWER] '
    elif color == 'C00000': tag = '[CHOICES]'
    elif color == '0000FF': tag = '[QUESTIO]'
    else:                   tag = '[SOLUTIO]'
    
    clean = text.replace('\t', ' | ')
    print(f"P{i:03d} {tag} | {clean[:120]}")
