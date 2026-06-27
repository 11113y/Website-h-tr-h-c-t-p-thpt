/* ══════════════════════════════════════════════
   DOCX Parser Utility for OLM Math Platform
   ══════════════════════════════════════════════ */

function getParas(xml) {
  return [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map(m => m[0]);
}

function parseOMathElement(elem) {
  const tag = elem.localName;
  
  if (tag === 'oMath') {
    return Array.from(elem.children).map(parseOMathElement).join('');
  } else if (tag === 'r') {
    const tNodes = elem.getElementsByTagNameNS('*', 't');
    return Array.from(tNodes).map(t => t.textContent || '').join('');
  } else if (tag === 'd') {
    let beg = '(';
    let end = ')';
    const dPr = Array.from(elem.children).find(c => c.localName === 'dPr');
    if (dPr) {
      const begChr = Array.from(dPr.children).find(c => c.localName === 'begChr');
      if (begChr) {
        beg = begChr.getAttribute('m:val') || begChr.getAttribute('val') || '(';
      }
      const endChr = Array.from(dPr.children).find(c => c.localName === 'endChr');
      if (endChr) {
        end = endChr.getAttribute('m:val') || endChr.getAttribute('val') || ')';
      }
    }
    const e = Array.from(elem.children).find(c => c.localName === 'e');
    const inner = e ? parseOMathElement(e) : '';
    return beg + inner + end;
  } else if (tag === 'acc') {
    let accentChar = '⃗';
    const accPr = Array.from(elem.children).find(c => c.localName === 'accPr');
    if (accPr) {
      const chr = Array.from(accPr.children).find(c => c.localName === 'chr');
      if (chr) {
        accentChar = chr.getAttribute('m:val') || chr.getAttribute('val') || '⃗';
      }
    }
    const e = Array.from(elem.children).find(c => c.localName === 'e');
    const inner = e ? parseOMathElement(e) : '';
    
    if (accentChar === '⃗' || accentChar === '\u20d7' || accentChar === '→') {
      return `\\vec{${inner}}`;
    } else if (accentChar === '^' || accentChar === '̂') {
      return Array.from(inner).map(c => /[a-zA-Z]/.test(c) ? c + '\u0302' : c).join('');
    }
    return inner;
  } else if (tag === 'f') {
    const numNode = Array.from(elem.children).find(c => c.localName === 'num');
    const denNode = Array.from(elem.children).find(c => c.localName === 'den');
    const num = numNode ? parseOMathElement(numNode) : '';
    const den = denNode ? parseOMathElement(denNode) : '';
    return `\\frac{${num}}{${den}}`;
  } else if (tag === 'limLow') {
    const eNode = Array.from(elem.children).find(c => c.localName === 'e');
    const limNode = Array.from(elem.children).find(c => c.localName === 'lim');
    const base = eNode ? parseOMathElement(eNode) : '';
    const limit = limNode ? parseOMathElement(limNode) : '';
    return `${base}_{${limit}}`;
  } else if (tag === 'sSub' || tag === 'sSup' || tag === 'sSubSup') {
    const eNode = Array.from(elem.children).find(c => c.localName === 'e');
    const subNode = Array.from(elem.children).find(c => c.localName === 'sub');
    const supNode = Array.from(elem.children).find(c => c.localName === 'sup');
    
    const base = eNode ? parseOMathElement(eNode) : '';
    const sub = subNode ? parseOMathElement(subNode) : '';
    const sup = supNode ? parseOMathElement(supNode) : '';
    
    let res = base;
    if (sub) res += `_${sub}`;
    if (sup) res += `^${sup}`;
    return res;
  } else if (tag === 'nary') {
    const subNode = Array.from(elem.children).find(c => c.localName === 'sub');
    const supNode = Array.from(elem.children).find(c => c.localName === 'sup');
    const eNode = Array.from(elem.children).find(c => c.localName === 'e');
    
    const sub = subNode ? parseOMathElement(subNode) : '';
    const sup = supNode ? parseOMathElement(supNode) : '';
    const inner = eNode ? parseOMathElement(eNode) : '';
    
    return `\\int_{${sub}}^{${sup}} ${inner}`;
  } else if (tag === 'bar') {
    const eNode = Array.from(elem.children).find(c => c.localName === 'e');
    const inner = eNode ? parseOMathElement(eNode) : '';
    return `\\bar{${inner}}`;
  } else {
    return Array.from(elem.children).map(parseOMathElement).join('');
  }
}

function getText(para, includeTab = false) {
  const parts = [];
  const tokenRe = /<w:r[ >][\s\S]*?<\/w:r>|<m:oMath>[\s\S]*?<\/m:oMath>/g;
  let m;
  const parser = new DOMParser();
  
  while ((m = tokenRe.exec(para)) !== null) {
    const tok = m[0];
    if (tok.startsWith('<w:r')) {
      if (includeTab && /<w:tab\/>/.test(tok)) parts.push('\t');
      const ts = [...tok.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(x => x[1]);
      parts.push(...ts);
    } else {
      try {
        const wrapXml = `<oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${tok}</oMath>`;
        const doc = parser.parseFromString(wrapXml, 'application/xml');
        const root = doc.documentElement;
        const mathText = parseOMathElement(root);
        if (mathText) {
          parts.push('$' + mathText + '$');
        }
      } catch (e) {
        const mt = [...tok.matchAll(/<m:t[^>]*>([\s\S]*?)<\/m:t>/g)].map(x => x[1]);
        if (mt.length) parts.push('$' + mt.join('') + '$');
      }
    }
  }
  return parts.join('').replace(/\^\s*['’‘]/g, "'");
}

function getColor(para) {
  const m = para.match(/<w:color w:val="([^"]+)"/);
  return m ? m[1].toUpperCase() : '';
}

function getHighlight(para) {
  const m = para.match(/<w:highlight w:val="([^"]+)"/);
  return m ? m[1] : '';
}

function getImagesInPara(para, relMap, imageBase64Map) {
  const rids = [];
  const relIdRe = /(?:r:id|r:embed|r:link|embed)="([^"]+)"/g;
  let m;
  while ((m = relIdRe.exec(para)) !== null) {
    const id = m[1];
    if (!rids.includes(id)) {
      rids.push(id);
    }
  }

  const imgs = [];
  for (const rid of rids) {
    const target = relMap[rid];
    if (target) {
      if (target.toLowerCase().endsWith('.wdp')) {
        console.warn('Ignoring .wdp image format:', target);
        continue;
      }
      if (imageBase64Map[target]) {
        imgs.push(imageBase64Map[target]);
      }
    }
  }
  return imgs;
}

function parseChoices(raw) {
  const tabParts = raw.split('\t').map(s => s.trim()).filter(Boolean);
  const choices = [];

  for (const part of tabParts) {
    const innerRe = /\b([A-D])\.\s*(.*?)(?=\s+\b[A-D]\.\s|$)/g;
    let cm;
    while ((cm = innerRe.exec(part)) !== null) {
      const text = cm[2].replace(/\s+/g, ' ').trim().replace(/\.\s*$/, '').trim();
      if (cm[1] && !choices.find(c => c.key === cm[1])) {
        choices.push({ key: cm[1], text });
      }
    }
  }

  if (choices.length < 2) {
    choices.length = 0;
    const re = /\b([A-D])\.\s*(.*?)(?=\s+\b[A-D]\.\s|$)/g;
    let cm;
    while ((cm = re.exec(raw)) !== null) {
      const text = cm[2].replace(/\s+/g, ' ').trim().replace(/\.\s*$/, '').trim();
      if (text && !choices.find(c => c.key === cm[1])) {
        choices.push({ key: cm[1], text });
      }
    }
  }

  choices.sort((a, b) => a.key.charCodeAt(0) - b.key.charCodeAt(0));
  return choices;
}

function parseAnswer(text, section = 'I') {
  const m = text.match(/(?:Lời\s+giải|Trả\s+lời|Đáp\s+án)\s*[:\-]?\s*(.+)/i);
  if (!m) return null;
  const raw = m[1].trim();
  
  if (section === 'III') {
    const numM = raw.match(/^(-?\d+(?:[.,]\d+)?)(.*)/);
    if (numM) {
      return { type: 'short', val: numM[1].trim(), rest: numM[2].trim() };
    }
    return { type: 'short', val: raw, rest: '' };
  }
  
  if (/^[A-D]$/i.test(raw)) return { type: 'abcd', val: raw.toUpperCase() };
  if (/[SĐ]/.test(raw)) {
    const vals = raw.split(/[-–]/).map(s => s.trim()).filter(Boolean);
    return { type: 'tf', vals };
  }
  return { type: 'abcd', val: raw.toUpperCase() };
}

function parseFromXml(xml, relMap = {}, imageBase64Map = {}) {
  const paras = getParas(xml);
  const questions = [];

  const classified = paras.map(p => {
    const hl    = getHighlight(p);
    const color = getColor(p);
    const rawText = getText(p, true);
    const text    = getText(p, false);
    
    let type = 'other';
    if (hl === 'yellow' || /^\s*(?:Lời\s+giải|Trả\s+lời|Đáp\s+án)/i.test(text))        type = 'answer';
    else if (color === 'C00000') type = 'choices';
    else if (/^\s*Câu\s+\d+/i.test(text) || (color === '0000FF' && /Câu\s+\d+/i.test(text))) type = 'question';
    
    return { type, rawText, text, para: p };
  });

  let i = 0;
  let currentSection = 'I';

  while (i < classified.length) {
    const item = classified[i];

    if (/Phần\s+III/i.test(item.text) && !/Câu\s+\d+/i.test(item.text)) {
      currentSection = 'III';
      i++; continue;
    }
    if (/Phần\s+II/i.test(item.text) && !/Câu\s+\d+/i.test(item.text)) {
      currentSection = 'II';
      i++; continue;
    }
    if (/Phần/i.test(item.text) && !/^\s*Câu\s+\d+/i.test(item.text)) {
      i++; continue;
    }

    if (item.type === 'question' && /^\s*Câu\s+\d+/i.test(item.text)) {
      const numM = item.text.match(/Câu\s+(\d+)/i);
      const num  = numM ? parseInt(numM[1]) : 0;

      const tagM = item.text.match(/\[([^\]]+)\]/);
      const tag  = tagM ? tagM[1] : null;

      let qtext = item.text
        .replace(/^\s*Câu\s+\d+[\s.:]+/i, '')
        .replace(/^\[[^\]]+\]\s*/, '')
        .trim();

      if (!qtext || /^Phần/i.test(qtext)) { i++; continue; }

      const block = { 
        num, 
        tag, 
        section: currentSection, 
        qtext, 
        choices: [], 
        answer: null, 
        solution: [], 
        tfStatements: [],
        images: getImagesInPara(item.para, relMap, imageBase64Map),
        sol_images: []
      };

      i++;
      while (i < classified.length) {
        const cur = classified[i];

        if (/Phần\s+(?:II|III)/i.test(cur.text)) break;
        if (cur.type === 'question' && /^\s*Câu\s+\d+/i.test(cur.text)) break;

        const pImages = getImagesInPara(cur.para, relMap, imageBase64Map);
        if (block.answer === null) {
          block.images.push(...pImages);
        } else {
          block.sol_images.push(...pImages);
        }

        if (cur.type === 'choices') {
          const parsed = parseChoices(cur.rawText);
          for (const c of parsed) {
            if (!block.choices.find(x => x.key === c.key)) block.choices.push(c);
          }
        } else if (cur.type === 'answer') {
          const ansObj = parseAnswer(cur.text, currentSection);
          if (ansObj) {
            if (ansObj.rest) {
              block.answer = { type: ansObj.type, val: ansObj.val };
              block.solution.push(ansObj.rest);
            } else {
              block.answer = ansObj;
            }
          }
        } else if (cur.type === 'other' && cur.text.trim()) {
          const t = cur.text.trim();
          if (currentSection === 'II' && block.answer === null) {
            const stmtM = t.match(/^([a-d])\)\s*(.+)/i);
            const hasNumPr = cur.para.includes('<w:numPr>');
            
            if (stmtM) {
              block.tfStatements.push({ key: stmtM[1].toLowerCase(), text: stmtM[2].trim() });
            } else if (hasNumPr) {
              const key = String.fromCharCode(97 + block.tfStatements.length);
              block.tfStatements.push({ key: key, text: t });
            } else {
              if (block.tfStatements.length === 0) {
                block.qtext += "\n" + t;
              } else {
                block.tfStatements[block.tfStatements.length - 1].text += " " + t;
              }
            }
          } else if (block.answer === null) {
            block.qtext += " " + t;
          } else {
            block.solution.push(t);
          }
        }
        i++;
      }

      block.images = [...new Set(block.images)];
      block.sol_images = [...new Set(block.sol_images)];
      questions.push(block);
    } else {
      i++;
    }
  }

  return questions;
}

async function decompressDeflateToBytes(compData) {
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  writer.write(compData);
  writer.close();

  const chunks = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total  = chunks.reduce((s, c) => s + c.length, 0);
  const merged = new Uint8Array(total);
  let offset   = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.length; }
  return merged;
}

async function decompressDeflate(compData, uncompSize) {
  const bytes = await decompressDeflateToBytes(compData);
  return new TextDecoder('utf-8').decode(bytes);
}

function bytesToBase64DataUrl(bytes, name) {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  const base64 = window.btoa(binary);
  const ext = name.split('.').pop().toLowerCase();
  
  let mime = 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
  else if (ext === 'gif') mime = 'image/gif';
  else if (ext === 'svg') mime = 'image/svg+xml';
  else if (ext === 'wdp') mime = 'image/vnd.ms-photo';
  
  return `data:${mime};base64,${base64}`;
}

async function unzipAllMediaAndXml(bytes) {
  const sig = [0x50, 0x4b, 0x03, 0x04];
  const decoder = new TextDecoder('utf-8');
  let pos = 0;
  
  let docXml = '';
  let relsXml = '';
  const mediaFiles = {};

  while (pos < bytes.length - 30) {
    if (bytes[pos]   !== sig[0] || bytes[pos+1] !== sig[1] ||
        bytes[pos+2] !== sig[2] || bytes[pos+3] !== sig[3]) {
      pos++; continue;
    }

    const compression  = bytes[pos+8]  | (bytes[pos+9]  << 8);
    const compSize     = bytes[pos+18] | (bytes[pos+19] << 8) | (bytes[pos+20] << 16) | (bytes[pos+21] << 24);
    const uncompSize   = bytes[pos+22] | (bytes[pos+23] << 8) | (bytes[pos+24] << 16) | (bytes[pos+25] << 24);
    const nameLen      = bytes[pos+26] | (bytes[pos+27] << 8);
    const extraLen     = bytes[pos+28] | (bytes[pos+29] << 8);

    const nameBytes = bytes.slice(pos+30, pos+30+nameLen);
    const name      = decoder.decode(nameBytes);
    const dataStart = pos + 30 + nameLen + extraLen;
    const dataEnd   = dataStart + compSize;

    if (name === 'word/document.xml') {
      const compData = bytes.slice(dataStart, dataEnd);
      docXml = compression === 0 ? decoder.decode(compData) : await decompressDeflate(compData, uncompSize);
    } else if (name === 'word/_rels/document.xml.rels') {
      const compData = bytes.slice(dataStart, dataEnd);
      relsXml = compression === 0 ? decoder.decode(compData) : await decompressDeflate(compData, uncompSize);
    } else if (name.startsWith('word/media/')) {
      const compData = bytes.slice(dataStart, dataEnd);
      let decompressed;
      if (compression === 0) {
        decompressed = compData;
      } else if (compression === 8) {
        decompressed = await decompressDeflateToBytes(compData);
      }
      if (decompressed) {
        mediaFiles[name] = decompressed;
      }
    }

    pos = dataEnd;
  }
  return { docXml, relsXml, mediaFiles };
}

export async function extractQuestionsFromDocx(file) {
  if (!file || !file.name.endsWith('.docx')) {
    throw new Error('Chỉ hỗ trợ file định dạng .docx (Microsoft Word)');
  }
  
  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);
  
  const { docXml, relsXml, mediaFiles } = await unzipAllMediaAndXml(bytes);
  
  const imageBase64Map = {};
  for (const [name, imgBytes] of Object.entries(mediaFiles)) {
    imageBase64Map[name] = bytesToBase64DataUrl(imgBytes, name);
  }

  const relMap = {};
  if (relsXml) {
    const relRe = /<Relationship\s+([^>]+)\/>/g;
    let rm;
    while ((rm = relRe.exec(relsXml)) !== null) {
      const rel = rm[1];
      const idM = rel.match(/Id="([^"]+)"/);
      const targetM = rel.match(/Target="([^"]+)"/);
      const typeM = rel.match(/Type="([^"]+)"/);
      if (idM && targetM && typeM && typeM[1].includes('relationships/image')) {
        let target = targetM[1];
        if (!target.startsWith('word/')) {
          target = 'word/' + target;
        }
        relMap[idM[1]] = target;
      }
    }
  }

  const questions = parseFromXml(docXml, relMap, imageBase64Map);
  return questions;
}
