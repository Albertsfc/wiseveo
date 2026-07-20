import { createAccountBalancesTool } from "./accounts.tool";
import { createBudgetTool } from "./budget.tool";
import { createCalendarDayTool } from "./calendar.tool";
import { createDreTool } from "./dre.tool";
import { createLatestTransactionsTool } from "./latest-transactions.tool";
import { createRecurringTransactionsTool } from "./recurring.tool";
import { createSummaryTool } from "./summary.tool";
import { createTransactionsTool } from "./transactions.tool";
import { createUpcomingTransactionsTool } from "./upcoming-transactions.tool";
import type { TelegramToolContext } from "../types/telegram.types";

export const getTools = (userId: string, ctx: TelegramToolContext) => ({
  get_upcoming_transactions: createUpcomingTransactionsTool(userId, ctx),
  get_latest_transactions: createLatestTransactionsTool(userId, ctx),
  get_transactions: createTransactionsTool(userId, ctx),
  get_recurring_transactions: createRecurringTransactionsTool(userId, ctx),
  get_account_balances: createAccountBalancesTool(userId, ctx),
  get_financial_summary: createSummaryTool(userId, ctx),
  get_dre: createDreTool(userId, ctx),
  get_budget: createBudgetTool(userId, ctx),
  get_calendar_day: createCalendarDayTool(userId, ctx),
});
