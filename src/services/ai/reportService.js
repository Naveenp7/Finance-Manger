import { getTransactionsByDateRange } from '../../firebase/transactionService';
import { formatCurrency } from '../../utils/formatters';

// Utility to format date as YYYY-MM-DD
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Get start of the week (Sunday)
const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

// Get end of the week (Saturday)
const getEndOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (6 - day);
  return new Date(d.setDate(diff));
};

// Get previous week
const getPreviousWeek = () => {
  const today = new Date();
  const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  return {
    start: formatDate(getStartOfWeek(lastWeek)),
    end: formatDate(getEndOfWeek(lastWeek))
  };
};

// Get current week
const getCurrentWeek = () => {
  return {
    start: formatDate(getStartOfWeek()),
    end: formatDate(getEndOfWeek())
  };
};

// Calculate percentage change
const calculatePercentChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Generate weekly summary
export const generateWeeklySummary = async (userId) => {
  try {
    // Get date ranges
    const currentWeek = getCurrentWeek();
    const previousWeek = getPreviousWeek();
    
    // Get transactions for both weeks
    const currentTransactions = await getTransactionsByDateRange(userId, currentWeek.start, currentWeek.end);
    const previousTransactions = await getTransactionsByDateRange(userId, previousWeek.start, previousWeek.end);
    
    // Check if we have enough data (at least 1 transaction)
    if (currentTransactions.length === 0 && previousTransactions.length === 0) {
      console.log('No transaction data found for weekly summary');
      return null; // Return null instead of sample data
    }
    
    // Calculate summaries based on real data only
    const currentSummary = calculateSummary(currentTransactions);
    const previousSummary = calculateSummary(previousTransactions);
    
    // Generate trend data based on real values
    const trends = {
      income: {
        amount: currentSummary.income,
        change: calculatePercentChange(currentSummary.income, previousSummary.income),
        direction: currentSummary.income >= previousSummary.income ? 'up' : 'down'
      },
      expense: {
        amount: currentSummary.expense,
        change: calculatePercentChange(currentSummary.expense, previousSummary.expense),
        direction: currentSummary.expense <= previousSummary.expense ? 'up' : 'down' // For expenses, down is positive
      },
      profit: {
        amount: currentSummary.profit,
        change: calculatePercentChange(currentSummary.profit, previousSummary.profit),
        direction: currentSummary.profit >= previousSummary.profit ? 'up' : 'down'
      }
    };
    
    // Get top categories from actual data
    const topIncomeCategories = getTopCategories(currentTransactions, 'income', 3);
    const topExpenseCategories = getTopCategories(currentTransactions, 'expense', 3);
    
    // Find notable transactions (unusually large) from real data
    const notableTransactions = findNotableTransactions(currentTransactions);
    
    // Generate insights based on real data
    const insights = generateInsights(
      currentSummary, 
      previousSummary, 
      topIncomeCategories, 
      topExpenseCategories, 
      notableTransactions
    );
    
    // Create weekly report with real data only
    return {
      period: {
        start: currentWeek.start,
        end: currentWeek.end
      },
      summary: currentSummary,
      previousSummary,
      trends,
      topIncomeCategories,
      topExpenseCategories,
      notableTransactions,
      insights,
      isSampleData: false // This is real data
    };
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return null; // Return null instead of mock data
  }
};

// Calculate summary from transactions
const calculateSummary = (transactions) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  return {
    income,
    expense,
    profit: income - expense,
    transactionCount: transactions.length
  };
};

// Get top categories by amount
const getTopCategories = (transactions, type, limit = 3) => {
  // Filter by type
  const filteredTransactions = transactions.filter(t => t.type === type);
  
  // If no transactions of this type, return empty array
  if (filteredTransactions.length === 0) {
    return [];
  }
  
  // Group by category
  const categoryMap = {};
  filteredTransactions.forEach(transaction => {
    if (!categoryMap[transaction.category]) {
      categoryMap[transaction.category] = 0;
    }
    categoryMap[transaction.category] += transaction.amount;
  });
  
  // Convert to array and sort
  const categories = Object.entries(categoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
    
  // Return top categories
  return categories.slice(0, limit);
};

// Find notable transactions (unusually large)
const findNotableTransactions = (transactions, threshold = 0.2) => {
  if (transactions.length === 0) return [];
  
  // Group by type
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Calculate average transaction amount by type
  const avgIncome = incomeTransactions.length > 0 
    ? incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length 
    : 0;
    
  const avgExpense = expenseTransactions.length > 0 
    ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length 
    : 0;
  
  // Find transactions significantly above average
  const notableIncome = incomeTransactions
    .filter(t => t.amount > avgIncome * (1 + threshold))
    .sort((a, b) => b.amount - a.amount);
    
  const notableExpenses = expenseTransactions
    .filter(t => t.amount > avgExpense * (1 + threshold))
    .sort((a, b) => b.amount - a.amount);
    
  // Combine and return top 5
  return [...notableIncome, ...notableExpenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
};

// Generate insights based on real data
const generateInsights = (
  currentSummary, 
  previousSummary, 
  topIncomeCategories, 
  topExpenseCategories, 
  notableTransactions
) => {
  const insights = [];
  
  // Add basic insights only if we have data
  if (currentSummary.transactionCount === 0) {
    insights.push({
      type: 'informative',
      text: 'No transactions found for this week. Add transactions to see insights.'
    });
    return insights;
  }
  
  // Income trend insights (only if we have income data)
  if (currentSummary.income > 0) {
    if (previousSummary.income > 0) {
      const incomeChange = calculatePercentChange(currentSummary.income, previousSummary.income);
      
      if (incomeChange > 15) {
        insights.push({
          type: 'positive',
          text: `Great job! Your income increased by ${incomeChange.toFixed(1)}% compared to last week.`
        });
      } else if (incomeChange < -15) {
        insights.push({
          type: 'negative',
          text: `Your income decreased by ${Math.abs(incomeChange).toFixed(1)}% compared to last week.`
        });
      }
    }
  }
  
  // Expense insights (only if we have expense data)
  if (currentSummary.expense > 0) {
    if (previousSummary.expense > 0) {
      const expenseChange = calculatePercentChange(currentSummary.expense, previousSummary.expense);
      
      if (expenseChange < -10) {
        insights.push({
          type: 'positive',
          text: `Your expenses decreased by ${Math.abs(expenseChange).toFixed(1)}% compared to last week.`
        });
      } else if (expenseChange > 20) {
        insights.push({
          type: 'warning',
          text: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last week.`
        });
      }
    }
  }
  
  // Profit insights
  if (currentSummary.profit > 0 && previousSummary.profit > 0) {
    const profitChange = calculatePercentChange(currentSummary.profit, previousSummary.profit);
    
    if (profitChange > 20) {
      insights.push({
        type: 'positive',
        text: `Your profit increased significantly by ${profitChange.toFixed(1)}% compared to last week.`
      });
    } else if (profitChange < -20) {
      insights.push({
        type: 'negative',
        text: `Your profit decreased by ${Math.abs(profitChange).toFixed(1)}% compared to last week.`
      });
    }
  } else if (currentSummary.profit < 0) {
    insights.push({
      type: 'warning',
      text: `You're operating at a loss this week. Your expenses (${formatCurrency(currentSummary.expense)}) exceed your income (${formatCurrency(currentSummary.income)}).`
    });
  }
  
  // Category insights
  if (topIncomeCategories.length > 0) {
    insights.push({
      type: 'informative',
      text: `Your top income source this week was ${topIncomeCategories[0].name} (${formatCurrency(topIncomeCategories[0].amount)}).`
    });
  }
  
  if (topExpenseCategories.length > 0) {
    insights.push({
      type: 'informative',
      text: `Your largest expense category this week was ${topExpenseCategories[0].name} (${formatCurrency(topExpenseCategories[0].amount)}).`
    });
  }
  
  // Notable transactions
  if (notableTransactions.length > 0) {
    const notable = notableTransactions[0];
    insights.push({
      type: notable.type === 'income' ? 'positive' : 'informative',
      text: `Notable ${notable.type}: ${formatCurrency(notable.amount)} on ${formatDate(notable.date)} (${notable.category}).`
    });
  }
  
  return insights;
};

// Export schedule function
export const scheduleWeeklySummary = async (userId) => {
  // Implementation not shown for brevity
  console.log(`Scheduling weekly summary for user ${userId}`);
  return { scheduled: true };
}; 