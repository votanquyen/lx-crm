# Researcher Report: Next.js 16 Production Readiness (Lộc Xanh CRM)

**Date:** 251219
**Topic:** Next.js 16 Production Best Practices & Security

---

## 1. Server Actions Best Practices

### Error Handling
- **Pattern:** Use `try/catch` blocks to return serializable state objects (e.g., `{ success: boolean, data?: any, error?: string }`).
- **Hook:** Use `useActionState` (React 19) to manage pending state and responses.
- **Security:** Do not return raw database errors to the client; map them to user-friendly messages.

### Revalidation
- **revalidatePath:** Purge cache for specific routes.
- **revalidateTag:** Precise purging via cache tags (preferred for high-frequency updates).
- **Pitfall:** Ensure revalidation occurs *before* `redirect()`, as redirect throws a control-flow exception.

### Prisma Transactions
- **Pattern:** Wrap multiple operations in `prisma.$transaction`.
- **Concurrency:** Use `tx` instance inside the transaction callback to ensure consistency.

---

## 2. File Upload Security (30MB Limit)

### MinIO/S3 Strategy
- **Direct Upload (Presigned URLs):** Recommended for 30MB files to bypass Server Action body limits and timeouts.
- **Validation:**
  - **Client-side:** Check `file.size` and `file.type` before request.
  - **Server-side:** Enforce `Content-Length` and `Content-Type` in presigned URL policy.
- **Security Headers:**
  - `Content-Security-Policy`: Restrict `img-src` to S3 domain.
  - `X-Content-Type-Options: nosniff`.

---

## 3. CSV Export Security & Compatibility

### Security (Injection Prevention)
- **Sanitization:** Prepend a single quote `'` to any cell starting with `=`, `+`, `-`, or `@`.
- **Encoding:** Use `UTF-8` for universal compatibility.

### Excel Compatibility (Vietnamese Support)
- **BOM (Byte Order Mark):** Prefix the CSV content with `\uFEFF` (EF BB BF) to force Excel to recognize UTF-8.
- **Implementation:** `const csvWithBom = '\uFEFF' + csvContent;`

---

## 4. Testing Strategies

### Server Action Testing
- **E2E (Playwright):** Preferred method to test the full Client-to-Server boundary.
- **Unit (Vitest):** Direct invocation of the action function with mocked `next/headers` and Prisma.

### API Route Testing
- **Integration:** Use Playwright's `request` to hit endpoints directly.
- **Unit:** Test handlers by passing mocked `NextRequest` objects.

---

## Sources
- [Next.js Documentation: Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [MinIO/S3 Presigned URLs Guide](https://aws.amazon.com/blogs/compute/uploading-to-amazon-s3-directly-from-a-web-or-mobile-application/)
- [OWASP CSV Injection Prevention](https://owasp.org/www-community/attacks/CSV_Injection)
- [Next.js Testing Best Practices](https://nextjs.org/docs/app/building-your-application/testing)

---

## Unresolved Questions
1. Specific Vercel/Provider timeout limits for long-running Server Actions in this project?
2. Exact MinIO bucket lifecycle policies for temporary file cleanup?
