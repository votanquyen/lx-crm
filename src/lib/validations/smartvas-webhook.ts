/**
 * SmartVAS Webhook Validation Schema
 * For n8n workflow to POST SmartVAS invoice data
 */
import { z } from "zod";

export const smartvasWebhookSchema = z.object({
  // Required from SmartVAS email
  invoiceNumber: z.string().min(1, "Số hóa đơn bắt buộc"),
  serialNumber: z.string().min(1, "Ký hiệu hóa đơn bắt buộc"),
  issueDate: z.string().transform((s) => new Date(s)),

  // Customer identification
  customerTaxCode: z.string().optional(),
  companyName: z.string().optional(),

  // Financial data
  subtotal: z.number().nonnegative(),
  vatAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),

  // Optional links
  pdfUrl: z.string().url().optional(),
  xmlUrl: z.string().url().optional(),

  // Metadata
  sourceEmail: z.string().email().optional(),
  processedAt: z.string().optional(),
});

export type SmartvasWebhookInput = z.infer<typeof smartvasWebhookSchema>;
