/**
 * Types for Dashboard Sticky Note Components
 */

export interface QuickNoteAIResponse {
  entities: {
    companies: string[];
    dates: string[];
    actions: string[];
    amounts: string[];
  };
  matchedCustomer: {
    id: string;
    companyName: string;
    score: number;
  } | null;
  customerContext: {
    activeContracts: number;
    overdueInvoices: number;
    totalDebt: number;
    recentNotes: number;
  } | null;
  suggestions: Array<{
    action: string;
    actionType: string;
    link?: string;
    priority: number;
  }>;
  noMatchCompanies: string[];
}
