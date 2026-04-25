import { apiClient } from './client';
import type { ParsedExpense, BudgetAdvice, InvestmentSuggestion } from '@types/index';

export const aiApi = {
  async parseVoice(text: string, baseCurrency: string): Promise<ParsedExpense> {
    const { data } = await apiClient.post('/ai/parse-voice', { text, base_currency: baseCurrency });
    return data;
  },

  async getBudgetAdvice(): Promise<BudgetAdvice> {
    const { data } = await apiClient.get('/ai/budget-advice');
    return data;
  },

  async getInvestmentSuggestions(): Promise<InvestmentSuggestion[]> {
    const { data } = await apiClient.get('/ai/investment-suggestions');
    return data;
  },

  async askQuestion(question: string): Promise<string> {
    const { data } = await apiClient.post('/ai/ask', { question });
    return data.answer;
  },
};
