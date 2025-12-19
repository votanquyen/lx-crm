/**
 * Unit Tests for Database Utilities
 * Tests decimal math operations for financial calculations
 */
import { describe, it, expect } from 'vitest';
import {
  toDecimal,
  toNumber,
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  divideDecimal,
  compareDecimal,
  formatCurrencyDecimal,
} from '../db-utils';

describe('db-utils: Decimal Conversions', () => {
  describe('toDecimal', () => {
    it('converts integers to Decimal', () => {
      const result = toDecimal(100);
      expect(result.toNumber()).toBe(100);
    });

    it('converts floating point numbers to Decimal', () => {
      const result = toDecimal(123.45);
      expect(result.toNumber()).toBe(123.45);
    });

    it('converts string numbers to Decimal', () => {
      const result = toDecimal('123.45');
      expect(result.toNumber()).toBe(123.45);
    });

    it('handles large numbers without precision loss', () => {
      const result = toDecimal('999999999.99');
      expect(result.toNumber()).toBe(999999999.99);
    });

    it('handles zero', () => {
      const result = toDecimal(0);
      expect(result.toNumber()).toBe(0);
    });

    it('handles negative numbers', () => {
      const result = toDecimal(-123.45);
      expect(result.toNumber()).toBe(-123.45);
    });
  });

  describe('toNumber', () => {
    it('converts Decimal to number', () => {
      const decimal = toDecimal(123.45);
      const result = toNumber(decimal);
      expect(result).toBe(123.45);
    });

    it('handles Decimal zero', () => {
      const decimal = toDecimal(0);
      const result = toNumber(decimal);
      expect(result).toBe(0);
    });

    it('handles large Decimal values', () => {
      const decimal = toDecimal('999999999.99');
      const result = toNumber(decimal);
      expect(result).toBe(999999999.99);
    });
  });
});

describe('db-utils: Arithmetic Operations', () => {
  describe('addDecimal', () => {
    it('adds two positive numbers', () => {
      const result = addDecimal(100, 50);
      expect(toNumber(result)).toBe(150);
    });

    it('adds decimal numbers with precision', () => {
      // Classic JavaScript floating point issue: 0.1 + 0.2 = 0.30000000000000004
      const result = addDecimal('0.1', '0.2');
      expect(toNumber(result)).toBe(0.3); // Decimal fixes this!
    });

    it('adds negative numbers', () => {
      const result = addDecimal(-50, -30);
      expect(toNumber(result)).toBe(-80);
    });

    it('adds positive and negative numbers', () => {
      const result = addDecimal(100, -30);
      expect(toNumber(result)).toBe(70);
    });

    it('adds zero', () => {
      const result = addDecimal(100, 0);
      expect(toNumber(result)).toBe(100);
    });

    it('handles large sums', () => {
      const result = addDecimal('999999999.99', '0.01');
      expect(toNumber(result)).toBe(1000000000);
    });
  });

  describe('subtractDecimal', () => {
    it('subtracts two positive numbers', () => {
      const result = subtractDecimal(100, 30);
      expect(toNumber(result)).toBe(70);
    });

    it('subtracts with decimal precision', () => {
      const result = subtractDecimal('1.1', '0.1');
      expect(toNumber(result)).toBe(1);
    });

    it('handles negative results', () => {
      const result = subtractDecimal(50, 100);
      expect(toNumber(result)).toBe(-50);
    });

    it('subtracts zero', () => {
      const result = subtractDecimal(100, 0);
      expect(toNumber(result)).toBe(100);
    });

    it('subtracts from zero', () => {
      const result = subtractDecimal(0, 50);
      expect(toNumber(result)).toBe(-50);
    });
  });

  describe('multiplyDecimal', () => {
    it('multiplies two positive numbers', () => {
      const result = multiplyDecimal(10, 5);
      expect(toNumber(result)).toBe(50);
    });

    it('multiplies decimal numbers', () => {
      const result = multiplyDecimal('19.99', 3);
      expect(toNumber(result)).toBe(59.97);
    });

    it('multiplies by zero', () => {
      const result = multiplyDecimal(100, 0);
      expect(toNumber(result)).toBe(0);
    });

    it('multiplies negative numbers', () => {
      const result = multiplyDecimal(-10, 5);
      expect(toNumber(result)).toBe(-50);
    });

    it('multiplies two negative numbers', () => {
      const result = multiplyDecimal(-10, -5);
      expect(toNumber(result)).toBe(50);
    });

    it('handles multiplication precision', () => {
      // Price: 99,999 VND, Quantity: 100 units
      const result = multiplyDecimal(99999, 100);
      expect(toNumber(result)).toBe(9999900);
    });
  });

  describe('divideDecimal', () => {
    it('divides two positive numbers', () => {
      const result = divideDecimal(100, 4);
      expect(toNumber(result)).toBe(25);
    });

    it('divides with decimal precision', () => {
      const result = divideDecimal(10, 3);
      expect(toNumber(result)).toBeCloseTo(3.33, 2);
    });

    it('divides negative numbers', () => {
      const result = divideDecimal(-100, 4);
      expect(toNumber(result)).toBe(-25);
    });

    it('handles division resulting in decimals', () => {
      const result = divideDecimal(7, 2);
      expect(toNumber(result)).toBe(3.5);
    });
  });
});

describe('db-utils: Comparison Operations', () => {
  describe('compareDecimal', () => {
    it('returns 0 for equal values', () => {
      expect(compareDecimal(100, 100)).toBe(0);
    });

    it('returns -1 for less than', () => {
      expect(compareDecimal(50, 100)).toBe(-1);
    });

    it('returns 1 for greater than', () => {
      expect(compareDecimal(100, 50)).toBe(1);
    });

    it('compares decimal values correctly', () => {
      expect(compareDecimal('0.1', '0.2')).toBe(-1);
      expect(compareDecimal('0.3', '0.2')).toBe(1);
    });

    it('compares zero', () => {
      expect(compareDecimal(0, 0)).toBe(0);
      expect(compareDecimal(1, 0)).toBe(1);
      expect(compareDecimal(0, 1)).toBe(-1);
    });

    it('compares negative numbers', () => {
      expect(compareDecimal(-50, -100)).toBe(1); // -50 > -100
      expect(compareDecimal(-100, -50)).toBe(-1); // -100 < -50
    });
  });
});

describe('db-utils: Formatting', () => {
  describe('formatCurrencyDecimal', () => {
    it('formats Vietnamese currency for numbers', () => {
      const result = formatCurrencyDecimal(1000000);
      expect(result).toBe('1.000.000\u00A0₫');
    });

    it('formats Vietnamese currency for Decimal', () => {
      const decimal = toDecimal('2500000');
      const result = formatCurrencyDecimal(decimal);
      expect(result).toBe('2.500.000\u00A0₫');
    });

    it('formats zero', () => {
      const result = formatCurrencyDecimal(0);
      expect(result).toBe('0\u00A0₫');
    });

    it('formats small amounts', () => {
      const result = formatCurrencyDecimal(500);
      expect(result).toBe('500\u00A0₫');
    });

    it('formats large amounts', () => {
      const result = formatCurrencyDecimal(999999999);
      expect(result).toBe('999.999.999\u00A0₫');
    });

    it('handles decimal places (rounds to integer)', () => {
      const result = formatCurrencyDecimal(1000000.49);
      expect(result).toBe('1.000.000\u00A0₫');
    });
  });
});

describe('db-utils: Real-world Scenarios', () => {
  it('calculates invoice total correctly', () => {
    // Item 1: 10 plants × 50,000 VND = 500,000 VND
    const item1 = multiplyDecimal(10, 50000);
    // Item 2: 5 plants × 75,000 VND = 375,000 VND
    const item2 = multiplyDecimal(5, 75000);
    // Total: 500,000 + 375,000 = 875,000 VND
    const total = addDecimal(item1, item2);

    expect(toNumber(total)).toBe(875000);
    expect(formatCurrencyDecimal(total)).toBe('875.000\u00A0₫');
  });

  it('calculates partial payment correctly', () => {
    const totalAmount = toDecimal(1000000);
    const payment1 = toDecimal(300000);
    const payment2 = toDecimal(200000);

    const paid = addDecimal(payment1, payment2);
    const outstanding = subtractDecimal(totalAmount, paid);

    expect(toNumber(outstanding)).toBe(500000);
    expect(compareDecimal(outstanding, 0)).toBe(1); // Still owe money
  });

  it('determines if invoice is fully paid', () => {
    const totalAmount = toDecimal(1000000);
    const paidAmount = toDecimal(1000000);

    const outstanding = subtractDecimal(totalAmount, paidAmount);

    expect(toNumber(outstanding)).toBe(0);
    expect(compareDecimal(outstanding, 0)).toBe(0); // Fully paid
  });

  it('detects overpayment', () => {
    const totalAmount = toDecimal(1000000);
    const paidAmount = toDecimal(1500000);

    const outstanding = subtractDecimal(totalAmount, paidAmount);

    expect(toNumber(outstanding)).toBe(-500000);
    expect(compareDecimal(outstanding, 0)).toBe(-1); // Overpaid
  });

  it('handles complex calculation with multiple operations', () => {
    // Contract: 20 plants × 60,000 VND/plant = 1,200,000 VND/month
    const monthlyRate = multiplyDecimal(20, 60000);

    // 12 months contract
    const totalContract = multiplyDecimal(monthlyRate, 12);

    // 10% discount
    const discount = divideDecimal(totalContract, 10);
    const finalAmount = subtractDecimal(totalContract, discount);

    expect(toNumber(monthlyRate)).toBe(1200000);
    expect(toNumber(totalContract)).toBe(14400000);
    expect(toNumber(discount)).toBe(1440000);
    expect(toNumber(finalAmount)).toBe(12960000);
  });

  it('prevents JavaScript floating point errors', () => {
    // Classic JavaScript problem: 0.1 + 0.2 !== 0.3
    expect(0.1 + 0.2).not.toBe(0.3); // JavaScript bug

    // Decimal library fixes this
    const result = addDecimal('0.1', '0.2');
    expect(toNumber(result)).toBe(0.3); // Correct!
  });
});
