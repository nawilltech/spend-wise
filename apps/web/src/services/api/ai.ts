import { apiClient } from './client';
import type { ParsedExpense, BudgetAdvice, InvestmentSuggestionsResponse } from '@/types';

export const aiApi = {
  async parseVoice(text: string, baseCurrency: string): Promise<ParsedExpense> {
    const { data } = await apiClient.post('/ai/parse-voice', { text, baseCurrency });
    return data;
  },

  async getBudgetAdvice(): Promise<BudgetAdvice> {
    const { data } = await apiClient.get('/ai/budget-advice');
    return data;
  },

  async getInvestmentSuggestions(): Promise<InvestmentSuggestionsResponse> {
    const { data } = await apiClient.get('/ai/investment-suggestions');
    return data;
  },

  async askQuestion(question: string): Promise<string> {
    const { data } = await apiClient.post('/ai/ask', { question });
    return data.answer;
  },
};
