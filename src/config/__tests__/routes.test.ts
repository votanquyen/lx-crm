/**
 * Unit Tests for RBAC (Role-Based Access Control)
 * Tests route permissions and access control logic
 */
import { describe, it, expect } from "vitest";
import { getRoutePermissions, canAccessRoute, ROUTE_PERMISSIONS } from "../routes";
import type { UserRole } from "@prisma/client";

describe("routes: Public Routes", () => {
  it("identifies public routes correctly", () => {
    expect(getRoutePermissions("/login")).toBeNull();
    expect(getRoutePermissions("/api/auth")).toBeNull();
    expect(getRoutePermissions("/api/auth/callback/google")).toBeNull();
    expect(getRoutePermissions("/api/health")).toBeNull();
    expect(getRoutePermissions("/unauthorized")).toBeNull();
  });

  it("allows unauthenticated access to public routes", () => {
    expect(canAccessRoute("/login", undefined)).toBe(true);
    expect(canAccessRoute("/api/auth", undefined)).toBe(true);
    expect(canAccessRoute("/api/health", undefined)).toBe(true);
    expect(canAccessRoute("/unauthorized", undefined)).toBe(true);
  });
});

describe("routes: Route Permissions Mapping", () => {
  describe("getRoutePermissions", () => {
    it("returns admin-only for /admin routes", () => {
      const permissions = getRoutePermissions("/admin");
      expect(permissions).toEqual(["ADMIN"]);
    });

    it("returns admin-only for /admin/users", () => {
      const permissions = getRoutePermissions("/admin/users");
      expect(permissions).toEqual(["ADMIN"]);
    });

    it("returns admin-only for /admin/settings", () => {
      const permissions = getRoutePermissions("/admin/settings");
      expect(permissions).toEqual(["ADMIN"]);
    });

    it("returns multiple roles for /customers", () => {
      const permissions = getRoutePermissions("/customers");
      expect(permissions).toEqual(["ADMIN", "MANAGER", "STAFF"]);
    });

    it("returns multiple roles for /invoices", () => {
      const permissions = getRoutePermissions("/invoices");
      expect(permissions).toEqual(["ADMIN", "MANAGER", "ACCOUNTANT"]);
    });

    it("returns multiple roles for /contracts", () => {
      const permissions = getRoutePermissions("/contracts");
      expect(permissions).toEqual(["ADMIN", "MANAGER"]);
    });

    it("returns all roles for dashboard", () => {
      const permissions = getRoutePermissions("/");
      expect(permissions).toEqual(["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"]);
    });

    it("uses longest prefix match", () => {
      // /admin/users is more specific than /admin
      const adminUsersPerms = getRoutePermissions("/admin/users");
      const adminPerms = getRoutePermissions("/admin");

      expect(adminUsersPerms).toEqual(["ADMIN"]);
      expect(adminPerms).toEqual(["ADMIN"]);
    });

    it("handles nested routes correctly", () => {
      expect(getRoutePermissions("/customers/123")).toEqual(["ADMIN", "MANAGER", "STAFF"]);
      expect(getRoutePermissions("/customers/123/edit")).toEqual(["ADMIN", "MANAGER", "STAFF"]);
      expect(getRoutePermissions("/invoices/456")).toEqual(["ADMIN", "MANAGER", "ACCOUNTANT"]);
    });
  });
});

describe("routes: Access Control by Role", () => {
  describe("ADMIN role", () => {
    it("can access all admin routes", () => {
      expect(canAccessRoute("/admin", "ADMIN")).toBe(true);
      expect(canAccessRoute("/admin/users", "ADMIN")).toBe(true);
      expect(canAccessRoute("/admin/settings", "ADMIN")).toBe(true);
    });

    it("can access all management routes", () => {
      expect(canAccessRoute("/customers", "ADMIN")).toBe(true);
      expect(canAccessRoute("/contracts", "ADMIN")).toBe(true);
      expect(canAccessRoute("/quotations", "ADMIN")).toBe(true);
    });

    it("can access all financial routes", () => {
      expect(canAccessRoute("/invoices", "ADMIN")).toBe(true);
    });

    it("can access all operational routes", () => {
      expect(canAccessRoute("/care-schedules", "ADMIN")).toBe(true);
      expect(canAccessRoute("/exchanges", "ADMIN")).toBe(true);
      expect(canAccessRoute("/sticky-notes", "ADMIN")).toBe(true);
    });

    it("can access dashboard", () => {
      expect(canAccessRoute("/", "ADMIN")).toBe(true);
      expect(canAccessRoute("/dashboard", "ADMIN")).toBe(true);
    });
  });

  describe("MANAGER role", () => {
    it("cannot access admin routes", () => {
      expect(canAccessRoute("/admin", "MANAGER")).toBe(false);
      expect(canAccessRoute("/admin/users", "MANAGER")).toBe(false);
      expect(canAccessRoute("/admin/settings", "MANAGER")).toBe(false);
    });

    it("can access management routes", () => {
      expect(canAccessRoute("/customers", "MANAGER")).toBe(true);
      expect(canAccessRoute("/contracts", "MANAGER")).toBe(true);
      expect(canAccessRoute("/quotations", "MANAGER")).toBe(true);
    });

    it("can access financial routes", () => {
      expect(canAccessRoute("/invoices", "MANAGER")).toBe(true);
    });

    it("can access operational routes", () => {
      expect(canAccessRoute("/care-schedules", "MANAGER")).toBe(true);
      expect(canAccessRoute("/exchanges", "MANAGER")).toBe(true);
    });

    it("can access dashboard", () => {
      expect(canAccessRoute("/", "MANAGER")).toBe(true);
    });
  });

  describe("ACCOUNTANT role", () => {
    it("cannot access admin routes", () => {
      expect(canAccessRoute("/admin", "ACCOUNTANT")).toBe(false);
      expect(canAccessRoute("/admin/users", "ACCOUNTANT")).toBe(false);
    });

    it("cannot access management routes", () => {
      expect(canAccessRoute("/contracts", "ACCOUNTANT")).toBe(false);
      expect(canAccessRoute("/quotations", "ACCOUNTANT")).toBe(false);
    });

    it("can access financial routes", () => {
      expect(canAccessRoute("/invoices", "ACCOUNTANT")).toBe(true);
    });

    it("cannot access operational routes", () => {
      expect(canAccessRoute("/care-schedules", "ACCOUNTANT")).toBe(false);
      expect(canAccessRoute("/exchanges", "ACCOUNTANT")).toBe(false);
    });

    it("can access dashboard", () => {
      expect(canAccessRoute("/", "ACCOUNTANT")).toBe(true);
    });
  });

  describe("STAFF role", () => {
    it("cannot access admin routes", () => {
      expect(canAccessRoute("/admin", "STAFF")).toBe(false);
      expect(canAccessRoute("/admin/users", "STAFF")).toBe(false);
    });

    it("cannot access management routes", () => {
      expect(canAccessRoute("/contracts", "STAFF")).toBe(false);
      expect(canAccessRoute("/quotations", "STAFF")).toBe(false);
    });

    it("cannot access financial routes", () => {
      expect(canAccessRoute("/invoices", "STAFF")).toBe(false);
    });

    it("can access customer routes", () => {
      expect(canAccessRoute("/customers", "STAFF")).toBe(true);
    });

    it("can access operational routes", () => {
      expect(canAccessRoute("/care-schedules", "STAFF")).toBe(true);
      expect(canAccessRoute("/exchanges", "STAFF")).toBe(true);
      expect(canAccessRoute("/sticky-notes", "STAFF")).toBe(true);
    });

    it("can access dashboard", () => {
      expect(canAccessRoute("/", "STAFF")).toBe(true);
    });
  });

  describe("VIEWER role", () => {
    it("cannot access admin routes", () => {
      expect(canAccessRoute("/admin", "VIEWER")).toBe(false);
    });

    it("cannot access any management routes", () => {
      expect(canAccessRoute("/contracts", "VIEWER")).toBe(false);
      expect(canAccessRoute("/invoices", "VIEWER")).toBe(false);
      expect(canAccessRoute("/customers", "VIEWER")).toBe(false);
    });

    it("can only access dashboard", () => {
      expect(canAccessRoute("/", "VIEWER")).toBe(true);
      expect(canAccessRoute("/dashboard", "VIEWER")).toBe(true);
    });
  });
});

describe("routes: Edge Cases", () => {
  it("blocks access when no user role provided", () => {
    expect(canAccessRoute("/customers", undefined)).toBe(false);
    expect(canAccessRoute("/contracts", undefined)).toBe(false);
    expect(canAccessRoute("/admin", undefined)).toBe(false);
  });

  it("allows public routes even with undefined role", () => {
    expect(canAccessRoute("/login", undefined)).toBe(true);
    expect(canAccessRoute("/api/auth", undefined)).toBe(true);
  });

  it("handles routes not in permission map", () => {
    // Routes not explicitly defined fall back to dashboard permissions (prefix match on '/')
    const permissions = getRoutePermissions("/some-undefined-route");
    expect(permissions).toEqual(["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"]);
  });

  it("handles trailing slashes correctly", () => {
    expect(canAccessRoute("/customers/", "STAFF")).toBe(true);
    expect(canAccessRoute("/admin/", "ADMIN")).toBe(true);
    expect(canAccessRoute("/invoices/", "ACCOUNTANT")).toBe(true);
  });
});

describe("routes: Security Scenarios", () => {
  it("prevents privilege escalation - STAFF trying to access admin", () => {
    const routes = ["/admin", "/admin/users", "/admin/settings"];
    routes.forEach((route) => {
      expect(canAccessRoute(route, "STAFF")).toBe(false);
    });
  });

  it("prevents privilege escalation - ACCOUNTANT trying to manage contracts", () => {
    const routes = ["/contracts", "/contracts/new", "/contracts/123/edit"];
    routes.forEach((route) => {
      expect(canAccessRoute(route, "ACCOUNTANT")).toBe(false);
    });
  });

  it("prevents privilege escalation - VIEWER trying anything besides dashboard", () => {
    const routes = ["/customers", "/contracts", "/invoices", "/care-schedules", "/admin"];
    routes.forEach((route) => {
      expect(canAccessRoute(route, "VIEWER")).toBe(false);
    });
  });

  it("enforces principle of least privilege", () => {
    // Each role should only access what they need
    const testCases: Array<{ route: string; allowedRoles: UserRole[] }> = [
      { route: "/admin/users", allowedRoles: ["ADMIN"] },
      { route: "/contracts", allowedRoles: ["ADMIN", "MANAGER"] },
      { route: "/invoices", allowedRoles: ["ADMIN", "MANAGER", "ACCOUNTANT"] },
      { route: "/care-schedules", allowedRoles: ["ADMIN", "MANAGER", "STAFF"] },
    ];

    const allRoles: UserRole[] = ["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "VIEWER"];

    testCases.forEach(({ route, allowedRoles }) => {
      allRoles.forEach((role) => {
        const shouldAccess = allowedRoles.includes(role);
        expect(canAccessRoute(route, role)).toBe(shouldAccess);
      });
    });
  });
});

describe("routes: Real-world Access Patterns", () => {
  it("admin can do everything", () => {
    const allRoutes = Object.keys(ROUTE_PERMISSIONS);
    allRoutes.forEach((route) => {
      expect(canAccessRoute(route, "ADMIN")).toBe(true);
    });
  });

  it("manager can manage business operations but not system settings", () => {
    expect(canAccessRoute("/customers", "MANAGER")).toBe(true);
    expect(canAccessRoute("/contracts", "MANAGER")).toBe(true);
    expect(canAccessRoute("/invoices", "MANAGER")).toBe(true);
    expect(canAccessRoute("/admin/users", "MANAGER")).toBe(false);
    expect(canAccessRoute("/admin/settings", "MANAGER")).toBe(false);
  });

  it("accountant is focused on finances only", () => {
    expect(canAccessRoute("/invoices", "ACCOUNTANT")).toBe(true);
    expect(canAccessRoute("/contracts", "ACCOUNTANT")).toBe(false);
    expect(canAccessRoute("/care-schedules", "ACCOUNTANT")).toBe(false);
  });

  it("staff handles operations only", () => {
    expect(canAccessRoute("/customers", "STAFF")).toBe(true);
    expect(canAccessRoute("/care-schedules", "STAFF")).toBe(true);
    expect(canAccessRoute("/exchanges", "STAFF")).toBe(true);
    expect(canAccessRoute("/contracts", "STAFF")).toBe(false);
    expect(canAccessRoute("/invoices", "STAFF")).toBe(false);
  });

  it("viewer can only view dashboard", () => {
    expect(canAccessRoute("/", "VIEWER")).toBe(true);
    expect(canAccessRoute("/dashboard", "VIEWER")).toBe(true);

    const restrictedRoutes = ["/customers", "/contracts", "/invoices", "/care-schedules", "/admin"];
    restrictedRoutes.forEach((route) => {
      expect(canAccessRoute(route, "VIEWER")).toBe(false);
    });
  });
});
