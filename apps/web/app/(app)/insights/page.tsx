'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { aiApi } from '@/services/api/ai';
import { useAuthStore } from '@/store/auth.store';
import { getCurrencySymbol } from '@/constants/currencies';
import { cn } from '@/lib/utils';
import type { BudgetAdvice, InvestmentSuggestionsResponse } from '@/types';

type Tab = 'budget' | 'invest';

function riskColor(level: string) {
  if (level === 'low')    return { bg: '#10B98120', border: '#10B981', text: '#10B981' };
  if (level === 'medium') return { bg: '#F59E0B20', border: '#F59E0B', text: '#F59E0B' };
  return { bg: '#EF444420', border: '#EF4444', text: '#EF4444' };
}

export default function InsightsPage() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');

  const [tab, setTab] = useState<Tab>('budget');
  const [budgetAdvice, setBudgetAdvice] = useState<BudgetAdvice | null>(null);
  const [investData, setInvestData] = useState<InvestmentSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgetAdvice = useCallback(async () => {
    if (budgetAdvice) return;
    setLoading(true); setError(null);
    try {
      setBudgetAdvice(await aiApi.getBudgetAdvice());
    } catch {
      setError('Could not load budget advice. Make sure you have some transactions first.');
    } finally {
      setLoading(false);
    }
  }, [budgetAdvice]);

  const loadInvestments = useCallback(async () => {
    if (investData) return;
    setLoading(true); setError(null);
    try {
      setInvestData(await aiApi.getInvestmentSuggestions() as unknown as InvestmentSuggestionsResponse);
    } catch {
      setError('Could not load investment suggestions.');
    } finally {
      setLoading(false);
    }
  }, [investData]);

  function handleTabChange(t: Tab) {
    setTab(t); setError(null);
    if (t === 'budget') loadBudgetAdvice();
    else loadInvestments();
  }

  const showPrompt = !loading && !error && ((tab === 'budget' && !budgetAdvice) || (tab === 'invest' && !investData));

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary">AI Insights</h1>

      {/* Tab selector */}
      <div className="flex bg-surface rounded-xl p-1 border border-border">
        {(['budget', 'invest'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
              tab === t ? 'bg-primary text-white' : 'text-text-secondary'
            )}
          >
            {t === 'budget' ? 'Budget Advice' : 'Investments'}
          </button>
        ))}
      </div>

      {showPrompt && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-5xl">🤖</span>
          <p className="text-lg font-semibold text-text-primary">
            {tab === 'budget' ? 'Get personalised budget advice' : 'Discover investment opportunities'}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
            {tab === 'budget'
              ? 'Your AI advisor will analyse your spending and suggest optimal budget allocations.'
              : 'Based on your income and savings rate, get tailored investment ideas.'}
          </p>
          <button
            onClick={() => tab === 'budget' ? loadBudgetAdvice() : loadInvestments()}
            className="mt-1 bg-primary text-white px-7 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Analyse now
          </button>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-text-secondary leading-relaxed">{error}</p>
          <button
            onClick={() => {
              if (tab === 'budget') { setBudgetAdvice(null); loadBudgetAdvice(); }
              else { setInvestData(null); loadInvestments(); }
            }}
            className="border border-primary text-primary px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            Try again
          </button>
        </Card>
      )}

      {/* Budget advice */}
      {tab === 'budget' && budgetAdvice && (
        <div className="space-y-4">
          {budgetAdvice.insights.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-text-primary mb-3">Key Insights</p>
              {budgetAdvice.insights.map((insight, i) => (
                <div key={i} className="flex gap-3 py-1.5">
                  <span className="text-base">💡</span>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">{insight}</p>
                </div>
              ))}
            </Card>
          )}

          {budgetAdvice.allocations.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-text-primary">Recommended Allocations</h2>
              {budgetAdvice.allocations.map((alloc, i) => (
                <Card key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">{alloc.category}</p>
                    <p className="text-lg font-bold text-primary">{alloc.percentage}%</p>
                  </div>
                  <div className="flex gap-5">
                    <p className="text-xs text-text-secondary">
                      Suggested: <span className="font-semibold text-text-primary">{symbol}{alloc.amount.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-text-secondary">
                      Current: <span className="font-semibold text-text-primary">{symbol}{alloc.current.toLocaleString()}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {budgetAdvice.actions.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-text-primary mb-3">Action Steps</p>
              {budgetAdvice.actions.map((action, i) => (
                <div key={i} className="flex gap-3 py-2 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">{action}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Investments */}
      {tab === 'invest' && investData && (
        <div className="space-y-4">
          {investData.monthlySurplus > 0 && (
            <div className="rounded-2xl p-5 space-y-1" style={{ background: '#0F4C75' }}>
              <p className="text-sm text-white/75">Monthly surplus available to invest</p>
              <p className="text-3xl font-bold text-white">{symbol}{investData.monthlySurplus.toLocaleString()}</p>
            </div>
          )}

          {investData.suggestions.map((s, i) => {
            const c = riskColor(s.riskLevel);
            return (
              <Card key={i} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-secondary">{s.type}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0"
                    style={{ background: c.bg, borderColor: c.border, color: c.text }}
                  >
                    {s.riskLevel} risk
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{s.description}</p>
                <div className="flex gap-5">
                  <p className="text-xs text-text-secondary">
                    Return: <span className="font-semibold text-text-primary">{s.expectedReturn}</span>
                  </p>
                  <p className="text-xs text-text-secondary">
                    Min: <span className="font-semibold text-text-primary">{symbol}{s.minimumAmount.toLocaleString()}</span>
                  </p>
                </div>
                {s.platforms && s.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.platforms.map((p) => (
                      <span key={p} className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-text-secondary">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
