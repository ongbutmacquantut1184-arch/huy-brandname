
import os

def fix_mojibake(text):
    res = []
    i = 0
    while i < len(text):
        char = text[i]
        # Only attempt to decode if the character is outside standard ASCII
        if ord(char) > 127:
            # Try 3 bytes
            if i + 2 < len(text):
                try:
                    b = text[i:i+3].encode('windows-1252')
                    c = b.decode('utf-8')
                    res.append(c)
                    i += 3
                    continue
                except:
                    pass
            # Try 2 bytes
            if i + 1 < len(text):
                try:
                    b = text[i:i+2].encode('windows-1252')
                    c = b.decode('utf-8')
                    res.append(c)
                    i += 2
                    continue
                except:
                    pass
        res.append(char)
        i += 1
    return ''.join(res)

def recover_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    recovered = fix_mojibake(content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(recovered)
    print(f'Recovered {path}')

files = [
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/contracts/page.tsx',
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/services/page.tsx',
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/requests/page.tsx',
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/sale/page.tsx'
]

for f in files:
    recover_file(f)

