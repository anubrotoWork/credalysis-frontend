// src/types/index.ts

export interface RiskAssessment {
    assessment_id: string;
    customer_id: string;
    assessment_date: string;
    credit_risk_score: number;
    fraud_risk_score: number;
    default_risk_score: number;
    overall_risk_score: number;
    risk_level: string;
    credit_score: number;
    credit_utilization_percent: number;
    debt_to_income_ratio: number;
    products_count: number;
    transaction_frequency: number;
    average_transaction_amount: number;
    recommendation: string;
    next_review_date: string;
  }

  export interface FinancialGoal {
    goal_id: string;
    customer_id: string;
    goal_type: string;
    goal_name: string;
    target_amount: number;
    current_amount: number;
    progress_percent: number;
    start_date: string;
    target_date: string;
    required_monthly_contribution: number;
    actual_monthly_contribution: number;
    on_track: number; // or boolean if your backend returns `true`/`false`
    status: string;
    priority: string;
    last_updated: string;
  }
  
  
  export interface FinancialInsight {
    insight_id: string;
    customer_id: string;
    insight_date: string;
    total_income: number;
    total_expenses: number;
    savings_rate: number;
    monthly_income: number;
    monthly_expenses: number;
    monthly_cash_flow: number;
    recurring_expenses: number;
    top_spending_categories: string;
    spending_insight: string;
    saving_insight: string;
    budget_insight: string;
    financial_health_score: number;
  }
  
  export interface Loan {
    customer_product_id: string;
    customer_id: string;
    product_id: string;
    balance: number;
    credit_limit: number;
    start_date: string;
    end_date: string;
    status: string;
    payment_amount: number;
    payment_frequency: string;
    interest_rate: number;
    annual_fee: number;
  }
  
  export interface ProductRecommendation {
    recommendation_id: string;
    customer_id: string;
    product_id: string;
    recommendation_date: string;
    match_score: number;
    rank: number;
    reason: string;
    potential_benefit: number;
    benefit_description: string;
    status: string;
    expiration_date: string;
  }
  