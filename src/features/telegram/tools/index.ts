import { createAccountBalancesTool } from "./accounts.tool";
import { createBudgetTool } from "./budget.tool";
import { createCalendarDayTool } from "./calendar.tool";
import { createDreTool } from "./dre.tool";
import { createLatestTransactionsTool } from "./latest-transactions.tool";
import { createRecurringTransactionsTool } from "./recurring.tool";
import { createSummaryTool } from "./summary.tool";
import { createTransactionsTool } from "./transactions.tool";
import { createUpcomingTransactionsTool } from "./upcoming-transactions.tool";

export const getTools = (userId: string) => ({
  get_upcoming_transactions: createUpcomingTransactionsTool(userId),
  get_latest_transactions: createLatestTransactionsTool(userId),
  get_transactions: createTransactionsTool(userId),
  get_recurring_transactions: createRecurringTransactionsTool(userId),
  get_account_balances: createAccountBalancesTool(userId),
  get_financial_summary: createSummaryTool(userId),
  get_dre: createDreTool(userId),
  get_budget: createBudgetTool(userId),
  get_calendar_day: createCalendarDayTool(userId),
});
