/**
 * Customer Entity Unit Tests
 * Tests domain logic without any infrastructure dependencies
 */
import { describe, it, expect } from "vitest";
import { Customer, InvalidCustomerError, InvalidStatusTransitionError } from "@/domain/customer";

describe("Customer Entity", () => {
  const validInput = {
    companyName: "Công ty TNHH ABC",
    address: "123 Nguyễn Văn Linh, Quận 7",
    district: "Quận 7",
    city: "TP.HCM",
    contactName: "Nguyễn Văn A",
    contactPhone: "0912345678",
  };

  describe("create", () => {
    it("creates valid customer with required fields", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(customer.id).toBe("cuid_123");
      expect(customer.code).toBe("KH-0001");
      expect(customer.companyName).toBe("Công ty TNHH ABC");
      expect(customer.status).toBe("ACTIVE");
    });

    it("normalizes Vietnamese company name", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(customer.companyNameNorm).toBe("cong ty tnhh abc");
    });

    it("normalizes address", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(customer.addressNorm).toBe("123 nguyen van linh, quan 7");
    });

    it("defaults city to TP.HCM", () => {
      const input = { ...validInput, city: undefined };
      const customer = Customer.create(input, "cuid_123", "KH-0001");

      expect(customer.city).toBe("TP.HCM");
    });

    it("defaults status to ACTIVE", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(customer.status).toBe("ACTIVE");
    });

    it("allows specifying status", () => {
      const input = { ...validInput, status: "LEAD" as const };
      const customer = Customer.create(input, "cuid_123", "KH-0001");

      expect(customer.status).toBe("LEAD");
    });

    it("throws on empty company name", () => {
      const input = { ...validInput, companyName: "" };

      expect(() => Customer.create(input, "cuid_123", "KH-0001")).toThrow(InvalidCustomerError);
    });

    it("throws on short company name", () => {
      const input = { ...validInput, companyName: "A" };

      expect(() => Customer.create(input, "cuid_123", "KH-0001")).toThrow(
        "Tên công ty phải có ít nhất 2 ký tự"
      );
    });

    it("throws on too long company name", () => {
      const input = { ...validInput, companyName: "A".repeat(256) };

      expect(() => Customer.create(input, "cuid_123", "KH-0001")).toThrow(
        "Tên công ty tối đa 255 ký tự"
      );
    });

    it("throws on short address", () => {
      const input = { ...validInput, address: "123" };

      expect(() => Customer.create(input, "cuid_123", "KH-0001")).toThrow(
        "Địa chỉ phải có ít nhất 5 ký tự"
      );
    });

    it("trims whitespace from inputs", () => {
      const input = {
        ...validInput,
        companyName: "  Company Name  ",
        address: "  Address  ",
      };
      const customer = Customer.create(input, "cuid_123", "KH-0001");

      expect(customer.companyName).toBe("Company Name");
      expect(customer.address).toBe("Address");
    });
  });

  describe("fromPersistence", () => {
    it("reconstructs entity from stored props", () => {
      const props = {
        id: "cuid_123",
        code: "KH-0001",
        companyName: "Company",
        companyNameNorm: "company",
        address: "Address",
        city: "TP.HCM",
        status: "ACTIVE" as const,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const customer = Customer.fromPersistence(props);

      expect(customer.id).toBe("cuid_123");
      expect(customer.status).toBe("ACTIVE");
      expect(customer.createdAt).toEqual(new Date("2024-01-01"));
    });
  });

  describe("update", () => {
    it("updates company name and normalizes", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      customer.update({ companyName: "Công ty Mới" });

      expect(customer.companyName).toBe("Công ty Mới");
      expect(customer.companyNameNorm).toBe("cong ty moi");
    });

    it("updates address and normalizes", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      customer.update({ address: "456 Lê Văn Việt" });

      expect(customer.address).toBe("456 Lê Văn Việt");
      expect(customer.addressNorm).toBe("456 le van viet");
    });

    it("only updates provided fields", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");
      const originalName = customer.companyName;

      customer.update({ contactPhone: "0987654321" });

      expect(customer.companyName).toBe(originalName);
      expect(customer.contactPhone).toBe("0987654321");
    });

    it("updates updatedAt timestamp", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");
      const originalUpdatedAt = customer.updatedAt;

      // Small delay to ensure timestamp difference
      customer.update({ contactName: "New Name" });

      expect(customer.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it("throws on invalid company name update", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(() => customer.update({ companyName: "A" })).toThrow(InvalidCustomerError);
    });
  });

  describe("status transitions", () => {
    describe("activate", () => {
      it("activates from LEAD", () => {
        const input = { ...validInput, status: "LEAD" as const };
        const customer = Customer.create(input, "cuid_123", "KH-0001");

        customer.activate();

        expect(customer.status).toBe("ACTIVE");
      });

      it("activates from INACTIVE", () => {
        const props = {
          id: "cuid_123",
          code: "KH-0001",
          companyName: "Company",
          companyNameNorm: "company",
          address: "Address",
          city: "TP.HCM",
          status: "INACTIVE" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const customer = Customer.fromPersistence(props);

        customer.activate();

        expect(customer.status).toBe("ACTIVE");
      });

      it("rejects activate from ACTIVE", () => {
        const customer = Customer.create(validInput, "cuid_123", "KH-0001");

        expect(() => customer.activate()).toThrow(InvalidStatusTransitionError);
      });

      it("rejects activate from TERMINATED", () => {
        const props = {
          id: "cuid_123",
          code: "KH-0001",
          companyName: "Company",
          companyNameNorm: "company",
          address: "Address",
          city: "TP.HCM",
          status: "TERMINATED" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const customer = Customer.fromPersistence(props);

        expect(() => customer.activate()).toThrow(InvalidStatusTransitionError);
      });
    });

    describe("deactivate", () => {
      it("deactivates from ACTIVE", () => {
        const customer = Customer.create(validInput, "cuid_123", "KH-0001");

        customer.deactivate();

        expect(customer.status).toBe("INACTIVE");
      });

      it("rejects deactivate from LEAD", () => {
        const input = { ...validInput, status: "LEAD" as const };
        const customer = Customer.create(input, "cuid_123", "KH-0001");

        expect(() => customer.deactivate()).toThrow(InvalidStatusTransitionError);
      });
    });

    describe("terminate", () => {
      it("terminates from ACTIVE", () => {
        const customer = Customer.create(validInput, "cuid_123", "KH-0001");

        customer.terminate();

        expect(customer.status).toBe("TERMINATED");
      });

      it("terminates from LEAD", () => {
        const input = { ...validInput, status: "LEAD" as const };
        const customer = Customer.create(input, "cuid_123", "KH-0001");

        customer.terminate();

        expect(customer.status).toBe("TERMINATED");
      });

      it("terminates from INACTIVE", () => {
        const props = {
          id: "cuid_123",
          code: "KH-0001",
          companyName: "Company",
          companyNameNorm: "company",
          address: "Address",
          city: "TP.HCM",
          status: "INACTIVE" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const customer = Customer.fromPersistence(props);

        customer.terminate();

        expect(customer.status).toBe("TERMINATED");
      });

      it("rejects terminate from TERMINATED", () => {
        const props = {
          id: "cuid_123",
          code: "KH-0001",
          companyName: "Company",
          companyNameNorm: "company",
          address: "Address",
          city: "TP.HCM",
          status: "TERMINATED" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const customer = Customer.fromPersistence(props);

        expect(() => customer.terminate()).toThrow(InvalidStatusTransitionError);
      });
    });
  });

  describe("canTerminate", () => {
    it("returns true when no active contracts", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(customer.canTerminate(false)).toBe(true);
    });

    it("returns false when has active contracts", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      expect(customer.canTerminate(true)).toBe(false);
    });

    it("returns false when already terminated", () => {
      const props = {
        id: "cuid_123",
        code: "KH-0001",
        companyName: "Company",
        companyNameNorm: "company",
        address: "Address",
        city: "TP.HCM",
        status: "TERMINATED" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const customer = Customer.fromPersistence(props);

      expect(customer.canTerminate(false)).toBe(false);
    });
  });

  describe("canTransitionTo", () => {
    it("LEAD can transition to ACTIVE", () => {
      const input = { ...validInput, status: "LEAD" as const };
      const customer = Customer.create(input, "cuid_123", "KH-0001");

      expect(customer.canTransitionTo("ACTIVE")).toBe(true);
    });

    it("LEAD can transition to TERMINATED", () => {
      const input = { ...validInput, status: "LEAD" as const };
      const customer = Customer.create(input, "cuid_123", "KH-0001");

      expect(customer.canTransitionTo("TERMINATED")).toBe(true);
    });

    it("LEAD cannot transition to INACTIVE", () => {
      const input = { ...validInput, status: "LEAD" as const };
      const customer = Customer.create(input, "cuid_123", "KH-0001");

      expect(customer.canTransitionTo("INACTIVE")).toBe(false);
    });

    it("TERMINATED cannot transition anywhere", () => {
      const props = {
        id: "cuid_123",
        code: "KH-0001",
        companyName: "Company",
        companyNameNorm: "company",
        address: "Address",
        city: "TP.HCM",
        status: "TERMINATED" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const customer = Customer.fromPersistence(props);

      expect(customer.canTransitionTo("ACTIVE")).toBe(false);
      expect(customer.canTransitionTo("INACTIVE")).toBe(false);
      expect(customer.canTransitionTo("LEAD")).toBe(false);
    });
  });

  describe("toPersistence", () => {
    it("exports all properties", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      const props = customer.toPersistence();

      expect(props.id).toBe("cuid_123");
      expect(props.code).toBe("KH-0001");
      expect(props.companyName).toBe("Công ty TNHH ABC");
      expect(props.companyNameNorm).toBe("cong ty tnhh abc");
      expect(props.address).toBe("123 Nguyễn Văn Linh, Quận 7");
      expect(props.status).toBe("ACTIVE");
    });

    it("returns a copy (not the internal object)", () => {
      const customer = Customer.create(validInput, "cuid_123", "KH-0001");

      const props1 = customer.toPersistence();
      const props2 = customer.toPersistence();

      expect(props1).not.toBe(props2);
      expect(props1).toEqual(props2);
    });
  });
});
