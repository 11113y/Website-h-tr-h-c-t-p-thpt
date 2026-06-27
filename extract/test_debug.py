import re
import zipfile
import xml.etree.ElementTree as ET

def get_paras(xml_content):
    return re.findall(r'<w:p[ >][\s\S]*?<\/w:p>', xml_content)

def get_text_simple(para_xml):
    # Strip XML tags to get text, keeping oMath text
    # A simple regex-based parser like JS getText
    parts = []
    token_re = re.compile(r'<w:r[ >][\s\S]*?<\/w:r>|<m:oMath>[\s\S]*?<\/m:oMath>')
    for m in token_re.finditer(para_xml):
        tok = m.group(0)
        if tok.startswith('<w:r'):
            ts = re.findall(r'<w:t[^>]*>([\s\S]*?)<\/w:t>', tok)
            parts.extend(ts)
        else:
            # simple math text extraction
            mt = re.findall(r'<m:t[^>]*>([\s\S]*?)<\/m:t>', tok)
            parts.extend(mt)
    return "".join(parts)

def get_images_in_para(para_xml, rel_map):
    rids = []
    embed_re = re.compile(r'embed="([^"]+)"')
    id_re = re.compile(r'r:id="([^"]+)"')
    
    for m in embed_re.finditer(para_xml):
        rids.append(m.group(1))
    for m in id_re.finditer(para_xml):
        rids.append(m.group(1))
        
    imgs = []
    for rid in rids:
        if rid in rel_map:
            imgs.append((rid, rel_map[rid]))
    return imgs

def debug_parse():
    with zipfile.ZipFile('../test_exam.docx') as z:
        doc_xml = z.read('word/document.xml').decode('utf-8')
        rels_xml = z.read('word/_rels/document.xml.rels').decode('utf-8')
        
    # Build relMap
    rel_map = {}
    rel_re = re.compile(r'<Relationship\s+([^>]+)\/>')
    for rm in rel_re.finditer(rels_xml):
        rel = rm.group(1)
        id_m = re.search(r'Id="([^"]+)"', rel)
        target_m = re.search(r'Target="([^"]+)"', rel)
        type_m = re.search(r'Type="([^"]+)"', rel)
        if id_m and target_m and type_m and 'relationships/image' in type_m.group(1):
            target = target_m.group(1)
            if not target.startswith('word/'):
                target = 'word/' + target
            rel_map[id_m.group(1)] = target

    paras = get_paras(doc_xml)
    print(f"Total paragraphs found: {len(paras)}")
    
    classified = []
    for idx, p in enumerate(paras):
        text = get_text_simple(p)
        
        # Classification logic from JS
        hl = ""
        hl_m = re.search(r'<w:highlight w:val="([^"]+)"', p)
        if hl_m:
            hl = hl_m.group(1)
            
        color = ""
        color_m = re.search(r'<w:color w:val="([^"]+)"', p)
        if color_m:
            color = color_m.group(1).upper()
            
        p_type = 'other'
        if hl == 'yellow' or re.match(r'^\s*(?:Lời\s+giải|Trả\s+lời|Đáp\s+án)', text, re.IGNORECASE):
            p_type = 'answer'
        elif color == 'C00000':
            p_type = 'choices'
        elif re.match(r'^\s*Câu\s+\d+', text, re.IGNORECASE) or (color == '0000FF' and 'Câu' in text):
            p_type = 'question'
            
        classified.append({
            'idx': idx,
            'type': p_type,
            'text': text,
            'xml': p
        })

    # Debug loop
    i = 0
    current_section = 'I'
    questions = []
    while i < len(classified):
        item = classified[i]
        text = item['text']
        
        if 'Phần III' in text and not re.match(r'^\s*Câu\s+\d+', text, re.IGNORECASE):
            current_section = 'III'
            i += 1
            continue
        if 'Phần II' in text and not re.match(r'^\s*Câu\s+\d+', text, re.IGNORECASE):
            current_section = 'II'
            i += 1
            continue
            
        if item['type'] == 'question' and re.match(r'^\s*Câu\s+\d+', text, re.IGNORECASE):
            num_m = re.search(r'Câu\s+(\d+)', text, re.IGNORECASE)
            num = int(num_m.group(1)) if num_m else 0
            
            qtext = text
            qtext = re.sub(r'^\s*Câu\s+\d+[\s.:]+', '', qtext, flags=re.IGNORECASE)
            qtext = re.sub(r'^\[[^\]]+\]\s*', '', qtext)
            
            block = {
                'num': num,
                'section': current_section,
                'qtext': qtext,
                'images': get_images_in_para(item['xml'], rel_map),
                'solution': [],
                'sol_images': [],
                'answer': None
            }
            
            i += 1
            while i < len(classified):
                cur = classified[i]
                cur_text = cur['text']
                
                if 'Phần II' in cur_text or 'Phần III' in cur_text:
                    break
                if cur['type'] == 'question' and re.match(r'^\s*Câu\s+\d+', cur_text, re.IGNORECASE):
                    break
                    
                p_images = get_images_in_para(cur['xml'], rel_map)
                if block['answer'] is None:
                    block['images'].extend(p_images)
                else:
                    block['sol_images'].extend(p_images)
                    
                if cur['type'] == 'choices':
                    pass
                elif cur['type'] == 'answer':
                    block['answer'] = cur_text
                elif cur['type'] == 'other' and cur_text.strip():
                    if block['answer'] is None:
                        block['qtext'] += " " + cur_text.strip()
                    else:
                        block['solution'].append(cur_text.strip())
                i += 1
            questions.append(block)
        else:
            i += 1
            
    print(f"Total questions parsed: {len(questions)}")
    for q in questions[:5]:
        print(f"\nCâu {q['num']} ({q['section']}):")
        print(f"  QText: {q['qtext'][:100]}...")
        print(f"  Images: {q['images']}")
        print(f"  Answer: {q['answer']}")
        print(f"  Sol Images: {q['sol_images']}")

if __name__ == '__main__':
    debug_parse()
