export interface CompanyInfo {
  firstName: string
  lastName: string
  companyName: string
  industry?: string
  employeeCount?: string
  email: string
}

export interface AssessmentQuestion {
  id: string
  category: string
  question: string
  options: {
    label: string
    value: number
    description?: string
  }[]
}

export interface AssessmentAnswer {
  questionId: string
  value: number
  /** Which option was picked (0-based); required when options share the same score value */
  optionIndex?: number
}

export interface DimensionScores {
  process: number
  tech: number
  org: number
  roi: number
  size?: number
}

export interface ReadinessScoreSnapshot {
  externalScore: number
  externalConfidence: number
  fpiScore: number
  signalCount: number
  signals: Record<string, number>
}

export interface AssessmentResults {
  companyInfo: CompanyInfo
  answers: AssessmentAnswer[]
  overallScore: number
  dimensionScores: DimensionScores
  tier: 'high' | 'good' | 'early' | 'explore'
  savedAssessmentId?: string
  savedClientId?: string
  scoring?: ReadinessScoreSnapshot
}

// Extended Report Metrics (10 metrics from the proposed structure)
export interface ExtendedReportData {
  // 1. Readiness Score
  readinessScore: {
    score: number
    breakdown: {
      technical: number
      organizational: number
      processMaturity: number
    }
  }
  
  // 2. Risk Index
  riskIndex: {
    score: number
    factors: {
      name: string
      severity: 'low' | 'medium' | 'high'
      description: string
    }[]
  }
  
  // 3. Top Automation Opportunities
  automationOpportunities: {
    department: string
    process: string
    currentEffort: string
    automationPotential: number
    estimatedROI: string
    implementation: 'quick-win' | 'medium-term' | 'long-term'
  }[]
  
  // 4. Cost-Benefit Snapshot
  costBenefit: {
    currentAnnualCost: number
    projectedSavings: number
    implementationCost: number
    paybackPeriod: string
    fiveYearROI: number
  }
  
  // 5. Recommended Tech Stack
  techStack: {
    category: string
    tool: string
    description: string
    priority: 'essential' | 'recommended' | 'nice-to-have'
  }[]
  
  // 6. 90-Day Action Plan
  actionPlan: {
    phase: string
    timeframe: string
    actions: string[]
    expectedOutcome: string
  }[]
  
  // 7. Benchmark Comparison
  benchmark: {
    metric: string
    yourScore: number
    industryAverage: number
    topPerformers: number
  }[]
  
  // 8. AI Disruption Risk
  disruptionRisk: {
    overallRisk: 'low' | 'medium' | 'high'
    affectedRoles: {
      role: string
      riskLevel: number
      recommendation: string
    }[]
    timelineEstimate: string
  }
  
  // 9. Implementation Roadmap
  roadmap: {
    quarter: string
    initiatives: {
      name: string
      priority: number
      resources: string
      dependencies: string[]
    }[]
  }[]
  
  // 10. Executive Summary
  executiveSummary: {
    headline: string
    keyFindings: string[]
    strategicRecommendations: string[]
    nextSteps: string[]
  }
}
