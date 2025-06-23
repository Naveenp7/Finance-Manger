import { askGemini } from './geminiService';
import { getAllUserTransactions } from '../../firebase/transactionService';
import { getCategories } from '../../firebase/categoryService';

class AIAgentService {
  constructor() {
    this.conversationHistory = [];
    this.userContext = null;
  }

  async initializeAgent(userId) {
    try {
      // Load user's financial data for context
      const [transactions, categories] = await Promise.all([
        getAllUserTransactions(),
        getCategories(userId)
      ]);
      
      this.userContext = {
        transactions,
        categories,
        userId,
        lastUpdated: new Date()
      };
      
      return true;
    } catch (error) {
      console.error('Failed to initialize AI agent:', error);
      return false;
    }
  }

  async processQuery(query, queryType = 'general') {
    try {
      if (!this.userContext) {
        return "I need to access your financial data first. Please wait while I initialize...";
      }

      const enhancedPrompt = this.buildEnhancedPrompt(query, queryType);
      const response = await askGemini(enhancedPrompt, this.userContext.transactions);
      
      // Store conversation for context
      this.conversationHistory.push({
        query,
        response,
        timestamp: new Date(),
        type: queryType
      });

      return response;
    } catch (error) {
      console.error('AI Agent query failed:', error);
      return "Sorry, I encountered an error processing your request. Please try again.";
    }
  }

  buildEnhancedPrompt(query, queryType) {
    const { transactions, categories } = this.userContext;
    
    // Calculate key metrics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryStats = this.calculateCategoryStats(transactions);
    const recentTransactions = this.getRecentTransactions(transactions, 10);
    
    const context = `
FINANCIAL DATA CONTEXT:
- Total Income: ₹${totalIncome.toLocaleString()}
- Total Expenses: ₹${totalExpenses.toLocaleString()}
- Net Balance: ₹${(totalIncome - totalExpenses).toLocaleString()}
- Number of Transactions: ${transactions.length}
- Available Categories: ${categories.map(c => c.name).join(', ')}

TOP EXPENSE CATEGORIES:
${categoryStats.slice(0, 5).map(cat => `- ${cat.category}: ₹${cat.amount.toLocaleString()}`).join('\n')}

RECENT TRANSACTIONS (Last 10):
${recentTransactions.map(t => 
  `- ${t.date}: ${t.type === 'income' ? '+' : '-'}₹${t.amount} (${t.category}) - ${t.description || 'No description'}`
).join('\n')}

CONVERSATION HISTORY:
${this.conversationHistory.slice(-3).map(h => `Q: ${h.query}\nA: ${h.response}`).join('\n\n')}

QUERY TYPE: ${queryType}
USER QUERY: ${query}

Please provide a helpful, accurate response based on the financial data above. Be specific with numbers and dates when relevant. If asked about trends, provide insights based on the transaction patterns.
`;

    return context;
  }

  calculateCategoryStats(transactions) {
    const categoryTotals = {};
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = transaction.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }

  getRecentTransactions(transactions, limit = 10) {
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  async detectAnomalies() {
    if (!this.userContext) return [];

    const { transactions } = this.userContext;
    const query = "Analyze my transactions and identify any unusual spending patterns, large expenses, or anomalies that I should be aware of.";
    
    return await this.processQuery(query, 'anomaly_detection');
  }

  async generateInsights() {
    if (!this.userContext) return [];

    const query = "Provide 5 key financial insights based on my spending patterns, including recommendations for improvement.";
    
    return await this.processQuery(query, 'insights');
  }

  async forecastExpenses(period = 'next_month') {
    if (!this.userContext) return null;

    const query = `Based on my historical spending patterns, forecast my expenses for the ${period}. Break it down by category and provide reasoning.`;
    
    return await this.processQuery(query, 'forecasting');
  }

  async getSummary(period = 'this_month') {
    if (!this.userContext) return null;

    const query = `Provide a comprehensive financial summary for ${period}, including income, expenses, top categories, and key trends.`;
    
    return await this.processQuery(query, 'summary');
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export const aiAgent = new AIAgentService();
export default AIAgentService;
