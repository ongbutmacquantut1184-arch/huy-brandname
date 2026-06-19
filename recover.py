
import os

def recover_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    try:
        raw_bytes = content.encode('windows-1252')
        recovered = raw_bytes.decode('utf-8')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(recovered)
        print(f'Recovered {path}')
    except Exception as e:
        print(f'Failed to recover {path}: {e}')

files = [
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/contracts/page.tsx',
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/services/page.tsx',
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/requests/page.tsx',
    'D:/T/Vibe code/CX_All-in-one/src/app/cx/sale/page.tsx'
]
for f in files:
    recover_file(f)

