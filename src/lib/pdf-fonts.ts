import { jsPDF } from "jspdf";
import { robotoRegularBase64, robotoBoldBase64 } from "./fonts/embedded-fonts";

/**
 * Adds Vietnamese-compatible fonts (Roboto) to the jsPDF instance.
 * @param doc The jsPDF instance
 */
export function setupVietnameseFonts(doc: jsPDF): void {
  // Add Regular font
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

  // Add Bold font
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  // Set default font to Roboto
  doc.setFont("Roboto", "normal");
}
