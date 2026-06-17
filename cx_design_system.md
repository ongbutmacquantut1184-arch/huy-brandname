# Đặc Tả Hệ Thống Thiết Kế (Design System Spec) - Dự án Quản lý Hủy Brandname

Tài liệu này định nghĩa chi tiết các Design Tokens, quy tắc Spacing, Shadows, Radius và Code mẫu các Component của Hệ thống Thiết kế mới (phối hợp giữa triết lý **Ant Design / Untitled UI** và kế thừa bảng màu gốc **Apple Style** sáng sủa).

---

## 1. Design Tokens (Biến CSS Hệ thống)

Hệ thống sử dụng CSS Custom Properties tại `:root` trong [globals.css](file:///d:/T/Vibe%20code/huy-brandname-nextjs/src/app/globals.css) để quản lý đồng bộ toàn bộ giao diện.

### 1.1. Hệ Màu Sắc (Color System - Apple Style)
Bao gồm màu chủ đạo (Primary Blue), màu điểm nhấn (Accent Orange/Gold), màu trung tính (Neutral) và màu trạng thái (Semantic).

| Token | Giá trị | Vai trò / Sử dụng |
| :--- | :--- | :--- |
| `--primary-500` | `#007AFF` | Màu xanh Apple chủ đạo |
| `--primary-600` | `#007AFF` | Trạng thái active chính |
| `--primary-700` | `#0066D6` | Hover trạng thái primary |
| `--primary-50` | `rgba(0, 122, 255, 0.08)` | Nền cho item được chọn/active |
| `--gold-500` | `#FF9500` | Apple Orange (Điểm nhấn phụ) |
| `--neutral-50` | `#F5F5F7` | Màu nền body sáng |
| `--neutral-100` | `#FFFFFF` | Nền Card phụ, Header bảng |
| `--neutral-200` | `#E8E8ED` | Đường viền mặc định (Border) |
| `--neutral-300` | `#D2D2D7` | Border hover, viền input |
| `--neutral-500` | `#86868B` | Chữ phụ, caption nhạt |
| `--neutral-700` | `#1D1D1F` | Chữ chính của toàn hệ thống |
| `--neutral-900` | `#1D1D1F` | Chữ đậm, tiêu đề chính |
| `--neutral-950` | `#FFFFFF` | Nền Sidebar sáng |

**Màu trạng thái (Semantic Status Colors):**
- **Success (Thành công):** `--success-600` (`#34C759` - Apple Green), nền `--success-50` (`rgba(52, 199, 89, 0.08)`)
- **Warning (Cảnh báo):** `--warning-600` (`#FF9500` - Apple Orange), nền `--warning-50` (`rgba(255, 149, 0, 0.08)`)
- **Error (Lỗi):** `--error-600` (`#FF3B30` - Apple Red), nền `--error-50` (`rgba(255, 59, 48, 0.08)`)
- **Info (Thông tin):** `--info-600` (`#007AFF` - Apple Blue), nền `--info-50` (`rgba(0, 122, 255, 0.08)`)

---

### 1.2. Bóng đổ (Whisper Shadows - Untitled UI)
Áp dụng bóng đổ nhiều lớp siêu mịn thay vì bóng đổ mặc định gắt.

```css
--shadow-xs: 0px 1px 2px rgba(16, 24, 40, 0.05);
--shadow-sm: 0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06);
--shadow-md: 0px 4px 8px -2px rgba(16, 24, 40, 0.08), 0px 2px 4px -2px rgba(16, 24, 40, 0.04);
--shadow-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
--shadow-xl: 0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);
```

---

### 1.3. Độ bo góc (Border Radius - Untitled UI)
Bo góc mềm mại tạo cảm giác hiện đại và cao cấp.

```css
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
```

---

### 1.4. Typography & Font chữ
- **Font-family chính:** `'Plus Jakarta Sans'`, sans-serif.
- **Font-size tiêu chuẩn:**
  - Cỡ chữ nhỏ (small text): `13px` (`.text-sm`)
  - Cỡ chữ cơ bản (body text): `14px` (`.text-base`)
  - Tiêu đề phụ (section title): `16px` (`.text-lg`)
  - Tiêu đề Card (card title): `18px` hoặc `20px` (`.text-xl`)
  - Tiêu đề Trang (page title): `28px` (`.text-2xl`)

---

## 2. Code Mẫu Component (UI Components Checklist)

### 2.1. Button (Nút bấm)
Sử dụng các class tiện ích có sẵn `.btn` kết hợp style cụ thể.

```html
<!-- Button Primary (Đầy màu, hiệu ứng gradient xanh Apple nhẹ) -->
<button className="btn btn-primary">
  Tìm Kiếm
</button>

<!-- Button Secondary (Nền trắng, viền xám nhẹ) -->
<button className="btn btn-secondary">
  Hủy Bỏ
</button>
```

CSS đi kèm trong `globals.css`:
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: var(--transition-fast);
  gap: 8px;
}
.btn:active {
  transform: scale(0.97);
}
.btn-primary {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
  color: #FFFFFF;
  border-color: var(--primary-700);
}
.btn-secondary {
  background-color: #FFFFFF;
  color: var(--neutral-700);
  border: 1px solid var(--neutral-300);
  box-shadow: var(--shadow-xs);
}
```

---

### 2.2. Input & Dropdowns (Trường nhập liệu)
Thiết kế phẳng kết hợp bóng đổ nhẹ và focus ring màu xanh dương sáng.

```html
<input 
  type="text" 
  className="input-field" 
  placeholder="Nhập tên Brandname..." 
/>
```

CSS đi kèm trong `globals.css`:
```css
.input-field {
  width: 100%;
  padding: 11px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-300);
  font-size: 14px;
  color: var(--neutral-900);
  background-color: #FFFFFF;
  transition: var(--transition-fast);
  outline: none;
  box-shadow: var(--shadow-xs);
}
.input-field:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px var(--primary-100);
}
```

---

### 2.3. Card Container (Khối nội dung)
Nền trắng, viền xám nhạt, bo góc lớn (`16px`) và bóng đổ mượt mà (`--shadow-sm`).

```html
<div className="card-container p-6">
  <h3>Tiêu đề Card</h3>
  <p>Nội dung hiển thị tại đây...</p>
</div>
```

CSS đi kèm trong `globals.css`:
```css
.card-container {
  background: #FFFFFF;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--neutral-200);
  overflow: hidden;
  transition: var(--transition-normal);
}
.card-container:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--neutral-300);
}
```

---

### 2.4. Bảng Dữ Liệu (Custom Table - Phân cấp Ant Design)
Bảng có dòng hover đổi màu nền sang xanh dương nhạt (`rgba(0, 122, 255, 0.08)`).

```html
<table className="custom-table">
  <thead>
    <tr>
      <th>Nhà mạng</th>
      <th>Trạng thái</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Viettel</td>
      <td><span className="badge-custom badge-success">Thành công</span></td>
    </tr>
  </tbody>
</table>
```

CSS đi kèm trong `globals.css`:
```css
.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.custom-table th {
  background-color: var(--neutral-100);
  color: var(--neutral-600);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 14px 16px;
  border-bottom: 1.5px solid var(--neutral-200);
}
.custom-table td {
  padding: 14px 16px;
  font-size: 14px;
  color: var(--neutral-700);
  border-bottom: 1px solid var(--neutral-200);
}
.custom-table tbody tr:hover td {
  background-color: var(--primary-50);
}
```

---

### 2.5. Badge (Nhãn trạng thái)
Bo tròn hoàn toàn (`var(--radius-full)`) với màu nền mờ nhạt từ hệ thống màu trạng thái.

```html
<!-- Trạng thái Thành Công -->
<span className="badge-custom badge-success">Thành công</span>

<!-- Trạng thái Cảnh báo -->
<span className="badge-custom badge-warning">Chờ duyệt</span>

<!-- Trạng thái Lỗi/Hủy -->
<span className="badge-custom badge-error">Đã hủy</span>
```

---

### 2.6. Custom Checkbox (Nút kiểm tra)
Thiết kế gọn gàng dạng lưới pixel-perfect từ Ant Design.

```html
<input type="checkbox" className="custom-checkbox" />
```

CSS trong `globals.css`:
```css
.custom-checkbox {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-xs);
  outline: none;
  cursor: pointer;
  display: inline-grid;
  place-content: center;
  background-color: #FFFFFF;
}
.custom-checkbox:checked {
  background-color: var(--primary-600);
  border-color: var(--primary-600);
}
.custom-checkbox:checked::before {
  content: "";
  width: 10px;
  height: 10px;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  background-color: #FFFFFF;
}
```

---

## 3. Cách Sử Dụng và Tích Hợp
1. Đảm bảo file `globals.css` được import trực tiếp vào root layout (`layout.tsx`).
2. Font chữ `'Plus Jakarta Sans'` nên được nạp qua `next/font/google` trong layout để tránh blocking compile-time:
   ```typescript
   import { Plus_Jakarta_Sans } from "next/font/google";
   const plusJakartaSans = Plus_Jakarta_Sans({
     subsets: ["latin", "vietnamese"],
     weight: ["400", "500", "600", "700"],
     display: "swap",
     variable: "--font-primary",
   });
   ```
3. Sử dụng các class CSS đã được tối ưu hóa như `.btn-primary`, `.card-container`, `.custom-checkbox`, `.badge-custom`, `.custom-table` để duy trì sự đồng nhất của giao diện trên toàn bộ hệ thống mà không cần định nghĩa lại màu sắc hardcode.
