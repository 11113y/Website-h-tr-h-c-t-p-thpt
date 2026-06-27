import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(script_dir, 'quiz_final.json')
mock_data_path = os.path.join(script_dir, '../frontend/src/data/mockData.js')

# Load final extracted quiz data
with open(json_path, 'r', encoding='utf-8') as f:
    raw_qs = json.load(f)

converted = []
for idx, q in enumerate(raw_qs):
    # Determine basic fields
    c_q = {
        "id": idx + 1,
        "section": q.get("section", "I"),
        "question": q.get("qtext", ""),
        "explanation": "\n".join(q.get("solution", []))
    }
    
    # Handle Section I multiple choice
    if c_q["section"] == "I":
        choices = q.get("choices", [])
        c_q["options"] = [c.get("text", "") for c in choices]
        
        # Convert ABCD answer letter to 0-3 index
        letter = q.get("answer", {}).get("val", "A") if q.get("answer") else "A"
        ans_idx = ord(letter.upper()) - 65
        c_q["answer"] = ans_idx
        
    elif c_q["section"] == "II":
        c_q["tfStatements"] = q.get("tfStatements", [])
        c_q["answer"] = q.get("answer", {"type": "tf", "vals": []})
        
    elif c_q["section"] == "III":
        c_q["answer"] = q.get("answer", {"type": "short", "val": ""})
        
    # Standardize image paths (prepend '/' to make them root-relative)
    c_q["images"] = [("/" + img if not img.startswith("/") else img) for img in q.get("images", [])]
    c_q["sol_images"] = [("/" + img if not img.startswith("/") else img) for img in q.get("sol_images", [])]
    
    converted.append(c_q)

# Load existing mockData.js
with open(mock_data_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Split at export const QUIZ_QUESTIONS
split_idx = content.find("export const QUIZ_QUESTIONS")
if split_idx != -1:
    header = content[:split_idx]
else:
    # If not found, create a basic fallback header
    header = "export const ROADMAP_STATIONS = [];\n\n"

# Rebuild new file contents
new_content = header + "export const QUIZ_QUESTIONS = " + json.dumps(converted, indent=2, ensure_ascii=False) + ";\n"

with open(mock_data_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully converted {len(converted)} questions into mockData.js")
