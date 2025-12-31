# Quick Testing Reference Card

## 🚀 Start Testing in 30 Seconds

### 1. Server Running?
```bash
# Check: http://localhost:3000
# If not running: pnpm dev
```

### 2. Login
```
Navigate to: http://localhost:3000
Login with your credentials
```

### 3. Quick Tests

#### View All Payments
```
URL: http://localhost:3000/payments
Expected: 5 payments displayed
```

#### Record a Payment (Easy Win)
```
1. Go to: http://localhost:3000/invoices
2. Click on "INV-202512-0002" (Văn phòng XYZ)
3. Click "Ghi nhận thanh toán"
4. Enter: 300,000đ (exact remaining amount)
5. Method: Chuyển khoản
6. Bank ref: TEST001
7. Submit
8. ✓ Status should change to PAID
```

---

## 📊 Test Data Quick Reference

### Invoices Available

| Invoice | Customer | Remaining | Test For |
|---------|----------|-----------|----------|
| INV-202512-0002 | KH-0003 | **300k** | Full payment → PAID |
| INV-202512-0003 | KH-0001 | **160k** | Full payment → PAID |
| INV-202512-0004 | KH-0002 | **5.9M** | Multiple partial payments |
| INV-202512-0001 | KH-0002 | **3.6M** | Large partial payment |
| INV-202512-0005 | KH-0003 | **6.9M** | Large partial payment |

### Payment Methods in Data
- BANK_TRANSFER: 3 payments (test most common)
- CASH: 1 payment (test cash flow)
- MOMO: 1 payment (test e-wallet)

---

## ✅ Essential Test Checklist

### Quick Wins (5 minutes)
- [ ] Open `/payments` - page loads
- [ ] Click payment card - detail page works
- [ ] Filter by "Chuyển khoản" - shows 3 results
- [ ] Record payment on INV-202512-0002 for 300k
- [ ] Verify invoice status → PAID

### Validation Tests (5 minutes)
- [ ] Try amount > remaining → Error
- [ ] Try future date → Error
- [ ] Bank transfer without ref → Error
- [ ] Cash without receiver → Error

### Full Workflow (10 minutes)
- [ ] List page stats correct
- [ ] Filters work (method + status)
- [ ] Detail page shows all info
- [ ] Record payment succeeds
- [ ] Invoice balance updates
- [ ] Status transitions work
- [ ] Payment appears in list

---

## 🐛 Common Issues & Fixes

**Page won't load?**
```bash
# Check server is running
curl http://localhost:3000
# Should return 307 (auth redirect)
```

**No invoices shown?**
```bash
# Re-run seed
pnpm db:seed
```

**Can't record payment?**
```
- Check you're logged in
- Check invoice isn't fully paid
- Check amount ≤ remaining balance
```

---

## 📝 Quick Verification Commands

**Check database counts:**
```bash
bunx tsx scripts/verify-payment-data.ts
```

**Expected output:**
```
Customers: 3
Contracts: 1
Invoices: 5
Payments: 5
✅ All balances correct
```

---

## 🎯 Success Markers

After testing, you should have:
- ✅ At least 1 invoice with PAID status
- ✅ At least 1 invoice with multiple payments
- ✅ Tested all validation rules
- ✅ Verified balance calculations
- ✅ Confirmed status transitions

---

## 📞 Need Help?

**Full testing guide:** `docs/payment-testing-guide.md`
**Data summary:** `docs/test-data-creation-summary.md`
**Completion status:** `docs/payment-recording-completion-summary.md`

---

**Ready to test? Go to:** http://localhost:3000/payments 🚀
