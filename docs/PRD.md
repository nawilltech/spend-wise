# Product Requirements Document — SpendWise

**Version:** 0.1.0  
**Date:** 2026-04-25  
**Status:** Draft

---

## 1. Problem Statement
Most people don't track their spending consistently because existing tools are either too complex, require manual work, or don't give actionable advice. SpendWise makes tracking effortless (voice input, smart categories) and turns raw data into real financial guidance using AI.

---

## 2. Target Users
- Young professionals managing salary + variable income
- Freelancers with irregular cash flow
- Anyone with financial goals: saving, debt payoff, investing
- Users across multiple currencies (primary: Nigerian market + global)

---

## 3. Core Modules

### 3.1 Income Setup
- Add income sources: salary, freelance, rental, dividends, side income
- Set frequency: one-time, weekly, monthly, quarterly, annual
- Attach currency per source

### 3.2 Expense Tracking
- Manual entry (form)
- Voice input — "spent 3500 naira on groceries"
- Auto-categorization via AI
- Link to budget category
- Add notes and receipt photo (v2)
- Recurring bills: electricity, rent, subscriptions (set repeat interval)

### 3.3 Spending Categories
- Default categories provided (Food, Transport, Housing, Health, Entertainment, Savings, Investment, Miscellaneous)
- Users can create, rename, delete, and reorder categories under Settings
- Each category has: name, icon, color, type (income/expense), tracking frequency

### 3.4 Budget & Goals
- Set monthly/weekly budget per category
- AI-generated overall budget recommendation (50/30/20 or custom) based on income, goals, and location
- Financial goals: save X by date Y, pay off debt, build emergency fund, travel fund
- Budget alerts: push notification when 80% of category budget is used
- Over-budget visual indicators

### 3.5 AI Financial Advisor
Triggers:
- On-demand ("What can I do better?")
- Auto after monthly close
- When anomaly detected (e.g. food spend 3× average)

Capabilities:
- Budget allocation recommendations
- Spending pattern insights
- Investment suggestions based on surplus, risk tolerance, and location
- Natural language Q&A: "Am I spending too much on transport?"
- Goal feasibility check and timeline projections

### 3.6 Analytics & Reporting
| Period | Content |
|--------|---------|
| Daily | Today vs. daily budget, recent transactions |
| Weekly | Category breakdown, trend vs. last week, top expense |
| Monthly | Full summary, savings rate, goal progress, AI insights |
| Quarterly | Trend analysis, investment recap, goal forecast |
| Annual | Year-in-review, net worth delta, top categories |

Export: PDF and CSV.

### 3.7 Settings
- Profile: name, location, base currency, risk tolerance
- Spending categories management
- Notification preferences
- Goal management
- Connected accounts (future: bank sync)
- Data export / backup
- Biometric lock

---

## 4. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Offline-first | Full CRUD without internet; sync on reconnect |
| Multicurrency | 150+ currencies; real-time rates cached every 24h |
| Voice input | Natural language in English (v1); more languages in v2 |
| Security | Biometric lock, AES-256 local encryption, JWT auth |
| Performance | App cold start < 2s; sync < 10s for 1000 records |
| Platforms | iOS 15+, Android 12+ |
| Accessibility | WCAG AA — screen reader support, high contrast mode |

---

## 5. Out of Scope (v1)
- Bank account / card linking
- Web dashboard
- Multi-user / family accounts
- Crypto tracking
- Tax calculations

---

## 6. Success Metrics
- 60% of users log at least one transaction per day (retention signal)
- AI advice rated 4+/5 by 70% of users
- Sync failure rate < 0.5%
- App crash rate < 0.1%
