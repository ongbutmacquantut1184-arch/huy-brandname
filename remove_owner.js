const fs = require('fs');
let code = fs.readFileSync('src/app/nhap-huy/page.tsx', 'utf8');

const replacements = [
  // 1. Remove states
  [
    `  const [ownerSearch, setOwnerSearch] = useState('');\n  const [cpSearch, setCpSearch] = useState('');\n  const [selectedBrand, setSelectedBrand] = useState<any>(null);\n  const [selectedCp, setSelectedCp] = useState<any>(null);\n  const [selectedOwner, setSelectedOwner] = useState<any>(null);\n`,
    `  const [cpSearch, setCpSearch] = useState('');\n  const [selectedBrand, setSelectedBrand] = useState<any>(null);\n  const [selectedCp, setSelectedCp] = useState<any>(null);\n`
  ],
  // 2. Remove ownerContainerRef
  [
    `  const brandContainerRef = useRef<HTMLDivElement>(null);\n  const cpContainerRef = useRef<HTMLDivElement>(null);\n  const ownerContainerRef = useRef<HTMLDivElement>(null);\n`,
    `  const brandContainerRef = useRef<HTMLDivElement>(null);\n  const cpContainerRef = useRef<HTMLDivElement>(null);\n`
  ],
  // 3. activeDropdown type
  [
    `const [activeDropdown, setActiveDropdown] = useState<'brand' | 'cp' | 'owner' | null>(null);`,
    `const [activeDropdown, setActiveDropdown] = useState<'brand' | 'cp' | null>(null);`
  ],
  [
    `const [modalType, setModalType] = useState<'brand' | 'cp' | 'owner'>('brand');`,
    `const [modalType, setModalType] = useState<'brand' | 'cp'>('brand');`
  ],
  // 4. Click outside logic
  [
    `      if (activeDropdown === 'owner' && ownerContainerRef.current && !ownerContainerRef.current.contains(event.target as Node)) {\n        setActiveDropdown(null);\n      }\n`,
    ``
  ],
  [
    `    document.addEventListener('mousedown', handleClickOutside);\n    return () => document.removeEventListener('mousedown', handleClickOutside);\n  }, [activeDropdown]);`,
    `    document.addEventListener('mousedown', handleClickOutside);\n    return () => document.removeEventListener('mousedown', handleClickOutside);\n  }, [activeDropdown]);`
  ],
  // 5. lookups formatting for owner
  [
    `      if (!ownerSearch && b.owner_id) {\n        const own = lookups.owners.find((o: any) => o.id === b.owner_id);\n        if (own) { setOwnerSearch(own.name); setSelectedOwner(own); }\n      }\n`,
    ``
  ],
  [
    `  useEffect(() => {\n    if (!lookups) return;\n    const o = lookups.owners.find((x: any) => x.name.trim().toLowerCase() === ownerSearch.trim().toLowerCase());\n    setSelectedOwner(o || null);\n  }, [ownerSearch, lookups]);\n`,
    ``
  ],
  // 6. case-sensitive brand & cp matching
  [
    `const b = lookups.brands.find((x: any) => x.name.trim().toLowerCase() === brandSearch.trim().toLowerCase());`,
    `const b = lookups.brands.find((x: any) => x.name.trim() === brandSearch.trim());`
  ],
  [
    `const c = lookups.cps.find((x: any) => x.name.trim().toLowerCase() === cpSearch.trim().toLowerCase());`,
    `const c = lookups.cps.find((x: any) => x.name.trim() === cpSearch.trim());`
  ],
  // 7. Load data effect
  [
    `        const owner = data.owner;\n        if (owner) {\n          setOwnerSearch(owner.name);\n          setSelectedOwner(owner);\n        }\n`,
    ``
  ],
  // 8. validateForm
  [
    `    if (!brandSearch) errs.push('Vui lòng nhập Brandname.');\n    else if (!selectedBrand) errs.push(\`Brandname "\${brandSearch}" chưa có trong hệ thống, vui lòng thêm mới.\`);\n\n    if (!cpSearch) errs.push('Vui lòng nhập CP_Name.');\n    else if (!selectedCp) errs.push(\`CP_Name "\${cpSearch}" chưa có trong hệ thống, vui lòng thêm mới.\`);\n\n    if (ownerSearch && !selectedOwner) errs.push(\`Company Owner "\${ownerSearch}" chưa có trong hệ thống, vui lòng thêm mới.\`);\n`,
    `    if (!brandSearch.trim()) errs.push('Vui lòng nhập Brandname.');\n\n    if (!cpSearch.trim()) errs.push('Vui lòng nhập CP_Name.');\n`
  ],
  // 9. handleCancelEdit
  [
    `    setBrandSearch('');\n    setCpSearch('');\n    setOwnerSearch('');\n    setSelectedBrand(null);\n    setSelectedCp(null);\n    setSelectedOwner(null);\n`,
    `    setBrandSearch('');\n    setCpSearch('');\n    setSelectedBrand(null);\n    setSelectedCp(null);\n`
  ],
  // 10. payload owner_id
  [
    `      owner_id: selectedOwner?.id || null,\n`,
    ``
  ]
];

for (const [search, replace] of replacements) {
  if (code.includes(search)) {
    code = code.replace(search, replace);
  } else {
    console.error("COULD NOT FIND:", search);
  }
}

// Remove the whole owner UI block
const ownerBlockRegex = /        \{\/\* Company Owner Input \*\/\}\n        <div style=\{\{ marginBottom: '20px', position: 'relative' \}\} ref=\{ownerContainerRef\}>[\s\S]*?        <\/div>\n\n        \{\/\* Operators & Providers Checkboxes \*\/\}/g;
if (ownerBlockRegex.test(code)) {
  code = code.replace(ownerBlockRegex, '        {/* Operators & Providers Checkboxes */}');
} else {
  console.error("Could not find owner UI block");
}

// Remove Add New buttons and alerts for brand and cp
const brandAddBtnRegex = /            <\/div>\n            <button className="apple-btn add-btn-small" onClick=\{\(\) => openAddModal\('brand', brandSearch\)\}>\n              \+ Thêm mới\n            <\/button>\n          <\/div>\n          \{\!selectedBrand && brandSearch && \([\s\S]*?          \)\}/g;
code = code.replace(brandAddBtnRegex, '            </div>\n          </div>');

const cpAddBtnRegex = /            <\/div>\n            <button className="apple-btn add-btn-small" onClick=\{\(\) => openAddModal\('cp', cpSearch\)\}>\n              \+ Thêm mới\n            <\/button>\n          <\/div>\n          \{cpSearch && \!selectedCp && \([\s\S]*?          \)\}/g;
code = code.replace(cpAddBtnRegex, '            </div>\n          </div>');

// Remove filteredOwners
const filteredOwnersRegex = /  const filteredOwners = lookups\?\.owners[\s\S]*?    : \[\];\n/g;
code = code.replace(filteredOwnersRegex, '');

fs.writeFileSync('src/app/nhap-huy/page.tsx', code);
