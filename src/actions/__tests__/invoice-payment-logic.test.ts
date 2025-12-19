/**
 * Integration Tests for Invoice Payment Logic
 * Tests payment calculation and status transitions
 */
import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  toNumber,
  addDecimal,
  subtractDecimal,
  compareDecimal,
  multiplyDecimal,
} from '@/lib/db-utils';

describe('Invoice Payment Logic: Calculation Tests', () => {
  describe('Invoice Amount Calculations', () => {
    it('calculates invoice total from line items correctly', () => {
      const items = [
        { description: 'Plant rental', quantity: 10, unitPrice: 50000 },
        { description: 'Plant care', quantity: 5, unitPrice: 30000 },
      ];

      const subtotal = items.reduce(
        (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
        toDecimal(0)
      );

      expect(toNumber(subtotal)).toBe(650000); // 500k + 150k
    });

    it('calculates complex invoice with many items', () => {
      const items = [
        { quantity: 15, unitPrice: 45000 },
        { quantity: 8, unitPrice: 62500 },
        { quantity: 20, unitPrice: 38000 },
        { quantity: 3, unitPrice: 125000 },
      ];

      const subtotal = items.reduce(
        (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
        toDecimal(0)
      );

      const expected = 15 * 45000 + 8 * 62500 + 20 * 38000 + 3 * 125000;
      expect(toNumber(subtotal)).toBe(expected); // 2,110,000
    });

    it('handles zero quantity items', () => {
      const items = [
        { quantity: 0, unitPrice: 50000 },
        { quantity: 5, unitPrice: 30000 },
      ];

      const subtotal = items.reduce(
        (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
        toDecimal(0)
      );

      expect(toNumber(subtotal)).toBe(150000); // Only second item
    });

    it('handles large quantities without overflow', () => {
      const items = [{ quantity: 1000, unitPrice: 999999 }];

      const subtotal = items.reduce(
        (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
        toDecimal(0)
      );

      expect(toNumber(subtotal)).toBe(999999000); // 999,999,000
    });
  });

  describe('Payment Application Logic', () => {
    it('applies partial payment correctly', () => {
      const totalAmount = 1000000;
      const payment = 300000;

      const paidAmount = addDecimal(0, payment);
      const outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(300000);
      expect(toNumber(outstanding)).toBe(700000);
    });

    it('applies multiple partial payments', () => {
      const totalAmount = 1000000;
      let paidAmount = toDecimal(0);

      // First payment: 300k
      paidAmount = addDecimal(paidAmount, 300000);
      let outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(300000);
      expect(toNumber(outstanding)).toBe(700000);

      // Second payment: 200k
      paidAmount = addDecimal(paidAmount, 200000);
      outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(500000);
      expect(toNumber(outstanding)).toBe(500000);

      // Third payment: 500k (completes)
      paidAmount = addDecimal(paidAmount, 500000);
      outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(1000000);
      expect(toNumber(outstanding)).toBe(0);
    });

    it('detects overpayment correctly', () => {
      const _totalAmount = 1000000;
      const outstandingAmount = 300000;
      const excessivePayment = 400000;

      const comparison = compareDecimal(excessivePayment, outstandingAmount);

      expect(comparison).toBeGreaterThan(0); // Payment exceeds outstanding
    });

    it('detects exact payment', () => {
      const outstandingAmount = 500000;
      const exactPayment = 500000;

      const comparison = compareDecimal(exactPayment, outstandingAmount);

      expect(comparison).toBe(0); // Exact match
    });

    it('detects underpayment', () => {
      const outstandingAmount = 500000;
      const partialPayment = 300000;

      const comparison = compareDecimal(partialPayment, outstandingAmount);

      expect(comparison).toBeLessThan(0); // Payment less than outstanding
    });
  });

  describe('Invoice Status Determination', () => {
    it('determines DRAFT status (no payments)', () => {
      const totalAmount = 1000000;
      const paidAmount = 0;

      const outstanding = subtractDecimal(totalAmount, paidAmount);
      const isPaid = compareDecimal(outstanding, 0) <= 0;
      const isPartial = toNumber(paidAmount) > 0 && !isPaid;

      expect(isPaid).toBe(false);
      expect(isPartial).toBe(false);
      // Status should be DRAFT or SENT (not PARTIAL or PAID)
    });

    it('determines PARTIAL status (some payment)', () => {
      const totalAmount = 1000000;
      const paidAmount = 300000;

      const outstanding = subtractDecimal(totalAmount, paidAmount);
      const isPaid = compareDecimal(outstanding, 0) <= 0;
      const isPartial = toNumber(paidAmount) > 0 && !isPaid;

      expect(isPaid).toBe(false);
      expect(isPartial).toBe(true);
      // Status should be PARTIAL
    });

    it('determines PAID status (full payment)', () => {
      const totalAmount = 1000000;
      const paidAmount = 1000000;

      const outstanding = subtractDecimal(totalAmount, paidAmount);
      const isPaid = compareDecimal(outstanding, 0) <= 0;

      expect(isPaid).toBe(true);
      expect(toNumber(outstanding)).toBe(0);
      // Status should be PAID
    });

    it('determines PAID status after multiple payments', () => {
      const totalAmount = 1000000;
      let paidAmount = toDecimal(0);

      // Payments: 400k + 300k + 300k = 1000k
      paidAmount = addDecimal(paidAmount, 400000);
      paidAmount = addDecimal(paidAmount, 300000);
      paidAmount = addDecimal(paidAmount, 300000);

      const outstanding = subtractDecimal(totalAmount, paidAmount);
      const isPaid = compareDecimal(outstanding, 0) <= 0;

      expect(isPaid).toBe(true);
      expect(toNumber(outstanding)).toBe(0);
    });
  });

  describe('Decimal Precision in Payment Flow', () => {
    it('maintains precision with decimal amounts', () => {
      const totalAmount = 1000000.5;
      const payment1 = 300000.2;
      const payment2 = 200000.15;

      const paidAmount = addDecimal(payment1, payment2);
      const outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(500000.35);
      expect(toNumber(outstanding)).toBe(500000.15);
    });

    it('prevents floating point errors in additions', () => {
      // Classic JS bug: 0.1 + 0.2 !== 0.3
      const payment1 = 100000.1;
      const payment2 = 200000.2;

      const paidAmount = addDecimal(payment1, payment2);

      expect(toNumber(paidAmount)).toBe(300000.3); // Correct, no floating point error
    });

    it('maintains precision in complex calculations', () => {
      const items = [
        { quantity: 10, unitPrice: 99.99 },
        { quantity: 5, unitPrice: 149.95 },
      ];

      const subtotal = items.reduce(
        (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
        toDecimal(0)
      );

      const expected = 10 * 99.99 + 5 * 149.95; // 999.9 + 749.75 = 1749.65
      expect(toNumber(subtotal)).toBe(expected);
    });
  });

  describe('Real-world Payment Scenarios', () => {
    it('processes full lifecycle: invoice creation to full payment', () => {
      // 1. Create invoice
      const items = [
        { quantity: 10, unitPrice: 60000 }, // 600k
        { quantity: 5, unitPrice: 40000 }, // 200k
      ];

      const totalAmount = items.reduce(
        (sum, item) => addDecimal(sum, multiplyDecimal(item.quantity, item.unitPrice)),
        toDecimal(0)
      );

      expect(toNumber(totalAmount)).toBe(800000);

      // 2. Initial state
      let paidAmount = toDecimal(0);
      let outstandingAmount = totalAmount;

      expect(toNumber(outstandingAmount)).toBe(800000);

      // 3. First partial payment: 300k
      paidAmount = addDecimal(paidAmount, 300000);
      outstandingAmount = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(300000);
      expect(toNumber(outstandingAmount)).toBe(500000);

      // 4. Second partial payment: 200k
      paidAmount = addDecimal(paidAmount, 200000);
      outstandingAmount = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(500000);
      expect(toNumber(outstandingAmount)).toBe(300000);

      // 5. Final payment: 300k
      paidAmount = addDecimal(paidAmount, 300000);
      outstandingAmount = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(800000);
      expect(toNumber(outstandingAmount)).toBe(0);

      // 6. Verify PAID status
      const isPaid = compareDecimal(outstandingAmount, 0) <= 0;
      expect(isPaid).toBe(true);
    });

    it('handles overpayment attempt validation', () => {
      const totalAmount = 1000000;
      const paidAmount = 600000;
      const outstandingAmount = subtractDecimal(totalAmount, paidAmount);
      const attemptedPayment = 500000; // More than 400k outstanding

      const wouldExceed = compareDecimal(attemptedPayment, outstandingAmount) > 0;

      expect(wouldExceed).toBe(true);
      expect(toNumber(outstandingAmount)).toBe(400000);
      // This payment should be rejected
    });

    it('processes monthly contract payments', () => {
      // Monthly contract: 20 plants × 50k/month = 1M/month
      const monthlyAmount = multiplyDecimal(20, 50000);
      expect(toNumber(monthlyAmount)).toBe(1000000);

      // Year contract: 12 months
      const yearlyAmount = multiplyDecimal(monthlyAmount, 12);
      expect(toNumber(yearlyAmount)).toBe(12000000);

      // 10% discount
      const discount = multiplyDecimal(yearlyAmount, 0.1);
      const finalAmount = subtractDecimal(yearlyAmount, discount);

      expect(toNumber(discount)).toBe(1200000);
      expect(toNumber(finalAmount)).toBe(10800000);
    });

    it('calculates payment installments', () => {
      const totalAmount = 12000000;
      const installments = 6;

      const installmentAmount = toNumber(toDecimal(totalAmount)) / installments;

      expect(installmentAmount).toBe(2000000);

      // Verify all installments sum to total
      let paidAmount = toDecimal(0);
      for (let i = 0; i < installments; i++) {
        paidAmount = addDecimal(paidAmount, installmentAmount);
      }

      expect(toNumber(paidAmount)).toBe(totalAmount);
    });

    it('handles mixed payment methods tracking', () => {
      const totalAmount = 1500000;
      let paidAmount = toDecimal(0);

      // Payment 1: Bank transfer 500k
      paidAmount = addDecimal(paidAmount, 500000);
      let outstanding = subtractDecimal(totalAmount, paidAmount);
      expect(toNumber(outstanding)).toBe(1000000);

      // Payment 2: Cash 300k
      paidAmount = addDecimal(paidAmount, 300000);
      outstanding = subtractDecimal(totalAmount, paidAmount);
      expect(toNumber(outstanding)).toBe(700000);

      // Payment 3: Bank transfer 700k (completes)
      paidAmount = addDecimal(paidAmount, 700000);
      outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(1500000);
      expect(toNumber(outstanding)).toBe(0);
      expect(compareDecimal(outstanding, 0)).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero total amount invoice', () => {
      const totalAmount = 0;
      const paidAmount = 0;

      const outstanding = subtractDecimal(totalAmount, paidAmount);
      const isPaid = compareDecimal(outstanding, 0) <= 0;

      expect(toNumber(outstanding)).toBe(0);
      expect(isPaid).toBe(true);
    });

    it('handles very large invoice amounts', () => {
      const largeAmount = 999999999; // Nearly 1 billion VND
      const payment = 500000000; // 500 million

      const paidAmount = addDecimal(0, payment);
      const outstanding = subtractDecimal(largeAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(500000000);
      expect(toNumber(outstanding)).toBe(499999999);
    });

    it('handles very small precision amounts', () => {
      const totalAmount = 1000.01;
      const payment = 500.005;

      const paidAmount = addDecimal(0, payment);
      const outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(500.005);
      expect(toNumber(outstanding)).toBe(500.005);
    });

    it('correctly identifies fully paid with rounding', () => {
      const totalAmount = 1000000;
      const payment1 = 333333.33;
      const payment2 = 333333.33;
      const payment3 = 333333.34;

      let paidAmount = toDecimal(0);
      paidAmount = addDecimal(paidAmount, payment1);
      paidAmount = addDecimal(paidAmount, payment2);
      paidAmount = addDecimal(paidAmount, payment3);

      const outstanding = subtractDecimal(totalAmount, paidAmount);

      expect(toNumber(paidAmount)).toBe(1000000);
      expect(toNumber(outstanding)).toBe(0);
      expect(compareDecimal(outstanding, 0)).toBe(0);
    });
  });
});
