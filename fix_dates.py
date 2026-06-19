import os
import re

def fix_date_inputs():
    for root, dirs, files in os.walk('D:/T/Vibe code/CX_All-in-one/src/app'):
        for f in files:
            if f.endswith('.tsx'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                new_content = re.sub(r'<input type="(date|month)"(?![^>]*onClick)', r'<input type="\1" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()}', content)
                
                if content != new_content:
                    with open(path, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    print(f"Updated date inputs in {path}")

fix_date_inputs()
