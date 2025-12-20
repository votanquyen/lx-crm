# Phase 03: Vietnamese Support

**Priority:** High
**Estimated Effort:** 2-3 days
**Dependencies:** Independent (can run parallel to Phase 02)

## Scope

Fix Vietnamese diacritics rendering in PDFs, Excel CSV encoding, and currency formatting.

## Issues to Fix

### 1. Vietnamese Characters in PDF
**File:** `src/app/api/schedules/[id]/briefing/route.ts:60-100`

**Problem:**
```typescript
import { jsPDF } from 'jspdf';

const doc = new jsPDF();
doc.setFont('helvetica'); // Default font - NO Vietnamese support!

doc.text('Khách hàng: Nguyễn Văn A', 10, 20);
// Renders as: "Khách hàng: Nguyn Văn A" (missing ễ, ă)
```

**Root Cause:**
- jsPDF's built-in fonts (helvetica, times, courier) use Latin-1 encoding
- Vietnamese diacritics require Unicode support
- Need custom font embedding

**Fix:**

**Step 1: Download Vietnamese-compatible font**
```bash
# Download Roboto (includes Vietnamese glyphs)
curl -o Roboto-Regular.ttf https://github.com/google/roboto/releases/download/v2.138/Roboto-Regular.ttf
```

**Step 2: Convert TTF to base64 (for embedding)**
```bash
# Option A: Use jsPDF font converter
npx jspdf-font-converter Roboto-Regular.ttf

# Option B: Manual base64 encoding
base64 Roboto-Regular.ttf > roboto-regular-base64.txt
```

**Step 3: Embed font in jsPDF**
```typescript
// src/lib/pdf-fonts.ts
import { jsPDF } from 'jspdf';

// Import base64-encoded font
import robotoRegular from './fonts/roboto-regular-base64.txt';

export function addVietnameseFont(doc: jsPDF) {
  // Add font to jsPDF
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

  // Set as default font
  doc.setFont('Roboto');
}

// Usage in briefing PDF:
const doc = new jsPDF();
addVietnameseFont(doc);

doc.text('Khách hàng: Nguyễn Văn Á', 10, 20); // Now renders correctly!
```

**Step 4: Font subsetting (reduce file size)**
```bash
# Install fonttools
pip install fonttools brotli

# Subset font to Vietnamese + Latin only
pyftsubset Roboto-Regular.ttf \
  --output-file=Roboto-Regular-VN.ttf \
  --unicodes="U+0000-007F,U+00A0-00FF,U+0100-017F,U+1E00-1EFF" \
  --layout-features="*" \
  --flavor=woff2

# Result: ~150KB → ~30KB
```

### 2. Excel CSV Encoding
**File:** `src/app/api/schedules/export/route.ts:80-85`

**Problem:**
```typescript
return new Response(csv, {
  headers: {
    'Content-Type': 'text/csv; charset=utf-8',
    // Missing UTF-8 BOM - Excel assumes Windows-1252 encoding!
  }
});
```

**Result in Excel:**
- "Nguyễn Văn A" → "Nguyá»…n VÄƒn A" (gibberish)

**Root Cause:**
- Excel on Windows defaults to Windows-1252 encoding
- UTF-8 files need BOM (Byte Order Mark) to be recognized

**Fix:**
```typescript
// Add UTF-8 BOM prefix
const BOM = '\uFEFF'; // UTF-8 BOM character

async function* generateCSVRows() {
  // MUST be first character in stream
  yield BOM + 'ID,Customer,Date,Status\n';

  // ... rest of CSV rows ...
}

// Alternative: Add BOM as binary prefix
const BOM_BYTES = new Uint8Array([0xEF, 0xBB, 0xBF]);

return new Response(
  new Blob([BOM_BYTES, csvContent]),
  {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="schedules.csv"'
    }
  }
);
```

### 3. Currency Formatting
**File:** `src/app/api/schedules/export/route.ts:55`

**Problem:**
```typescript
// Uses non-breaking space (U+00A0) - Excel treats as text!
const price = (1000000).toLocaleString('vi-VN', {
  style: 'currency',
  currency: 'VND'
});
// Result: "1.000.000 ₫" (note the space)

// CSV cell:
csv += `"${price}",`; // Excel can't sum this!
```

**Fix:**
```typescript
function formatCurrencyForCSV(amount: number): string {
  // Format with regular spaces (not nbsp)
  const formatted = amount.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // Remove non-breaking spaces
  return formatted.replace(/\u00A0/g, ' ');
}

// Or: Export as number (no formatting)
csv += `${amount},`; // Let Excel format it
```

**Alternative: Separate numeric column**
```csv
Description,Price (VND),Price Formatted
"Maintenance","1000000","1.000.000 ₫"
```

## Implementation Steps

### Step 1: Font Setup (Day 1)
1. Download Roboto Regular + Bold fonts
2. Subset for Vietnamese glyphs:
   ```bash
   # Create src/lib/fonts directory
   mkdir -p src/lib/fonts

   # Download fonts
   wget https://github.com/google/roboto/releases/download/v2.138/roboto-android.zip
   unzip -j roboto-android.zip "Roboto-Regular.ttf" "Roboto-Bold.ttf" -d src/lib/fonts

   # Subset (Vietnamese + Latin + Digits + Punctuation)
   pyftsubset src/lib/fonts/Roboto-Regular.ttf \
     --output-file=src/lib/fonts/Roboto-Regular-VN.woff2 \
     --unicodes="U+0020-007E,U+00A0-00FF,U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01B0,U+1EA0-1EF9" \
     --flavor=woff2
   ```

3. Convert to base64:
   ```bash
   base64 src/lib/fonts/Roboto-Regular-VN.woff2 > src/lib/fonts/roboto-regular-vn-base64.txt
   ```

### Step 2: PDF Integration (Day 1-2)
1. Create `src/lib/pdf-fonts.ts`:
   ```typescript
   import { jsPDF } from 'jspdf';
   import robotoRegularBase64 from './fonts/roboto-regular-vn-base64.txt';
   import robotoBoldBase64 from './fonts/roboto-bold-vn-base64.txt';

   export function setupVietnameseFonts(doc: jsPDF) {
     // Add Regular
     doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
     doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

     // Add Bold
     doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
     doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

     // Set default
     doc.setFont('Roboto', 'normal');
   }
   ```

2. Update briefing PDF generator:
   ```typescript
   // src/app/api/schedules/[id]/briefing/route.ts
   import { setupVietnameseFonts } from '@/lib/pdf-fonts';

   const doc = new jsPDF();
   setupVietnameseFonts(doc); // Add fonts BEFORE text rendering

   // Now Vietnamese text works
   doc.text('Công ty: Lộc Xanh', 10, 20);
   doc.setFont('Roboto', 'bold');
   doc.text('Khách hàng: Nguyễn Văn Á', 10, 30);
   ```

### Step 3: CSV Encoding Fix (Day 2)
1. Add BOM to streaming CSV:
   ```typescript
   // src/app/api/schedules/export/route.ts
   async function* generateCSVRows() {
     const BOM = '\uFEFF';
     yield BOM + 'ID,Khách hàng,Ngày,Trạng thái\n';
     // ... rest of rows ...
   }
   ```

2. Test in Excel (Windows + Mac)

### Step 4: Currency Formatting (Day 3)
1. Create `src/lib/format-utils.ts`:
   ```typescript
   export function formatCurrencyForExcel(amount: number): string {
     return amount.toLocaleString('vi-VN', {
       minimumFractionDigits: 0,
       maximumFractionDigits: 0
     }).replace(/\u00A0/g, ' '); // Remove nbsp
   }

   export function formatCurrencyForPDF(amount: number): string {
     return amount.toLocaleString('vi-VN', {
       style: 'currency',
       currency: 'VND'
     });
   }
   ```

2. Update CSV export to use `formatCurrencyForExcel()`
3. Update PDF to use `formatCurrencyForPDF()`

## Testing Checklist

- [ ] PDF contains "Nguyễn Văn Á" (not "Nguyn Văn A")
- [ ] PDF renders all Vietnamese diacritics: ă, â, đ, ê, ô, ơ, ư, á, à, ả, ã, ạ, etc.
- [ ] Excel CSV opens with correct Vietnamese text (no BOM warning)
- [ ] LibreOffice Calc opens CSV correctly
- [ ] Google Sheets imports CSV with correct encoding
- [ ] Currency amounts are Excel-summable (or separate numeric column)
- [ ] PDF file size increase <100KB (font subsetting works)

## Success Criteria

- All Vietnamese characters render correctly in PDFs
- Excel opens CSVs without encoding prompt
- Currency formatting works in Excel formulas

## Font Size Comparison

| Font | Full Size | Subsetted (VN+Latin) |
|------|-----------|---------------------|
| Roboto Regular | 168 KB | ~28 KB |
| Roboto Bold | 162 KB | ~26 KB |
| **Total** | 330 KB | **~54 KB** |

## Alternative Fonts

If Roboto too large:
- **Noto Sans** (Google, comprehensive Vietnamese support)
- **SVN-Poppins** (lighter, modern)
- **Inter** (variable font, excellent rendering)

## Unresolved Questions

- Do we need Roboto Italic/Medium/Light (other weights)?
- Should PDFs use system fonts on client (avoid embedding)?
- Do we support other languages (English, Chinese)?
- Which Vietnamese glyph coverage: Full (1EFF) or minimal (common chars only)?
