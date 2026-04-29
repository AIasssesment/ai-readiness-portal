'use client'

import { create } from 'zustand'
import type { CompanyInfo, AssessmentAnswer, AssessmentResults, ExtendedReportData, DimensionScores } from './types'
import { ASSESSMENT_QUESTIONS, ADVICE_MAP } from './assessment-data'

interface AssessmentStore {
  // Form state
  step: 'info' | 'questions' | 'analyzing' | 'results'
  currentQuestionIndex: number
  companyInfo: CompanyInfo | null
  answers: AssessmentAnswer[]
  results: AssessmentResults | null
  extendedReport: ExtendedReportData | null
  hasPurchasedExtended: boolean
  
  // Actions
  setCompanyInfo: (info: CompanyInfo) => void
  answerQuestion: (questionId: string, value: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  calculateResults: () => void
  setStep: (step: 'info' | 'questions' | 'analyzing' | 'results') => void
  purchaseExtendedReport: () => void
  reset: () => void
}

function calculateDimensionScore(dimension: string, answers: AssessmentAnswer[]): number {
  const questions = ASSESSMENT_QUESTIONS.filter((q) => q.category === dimension)
  if (questions.length === 0) return 0
  
  let total = 0
  let maxTotal = 0
  
  questions.forEach((q) => {
    const answer = answers.find((a) => a.questionId === q.id)
    const maxScore = Math.max(...q.options.map((o) => o.value))
    maxTotal += maxScore
    if (answer) {
      total += answer.value
    }
  })
  
  return Math.round((total / maxTotal) * 100)
}

function getTierInfo(score: number): { tier: 'high' | 'good' | 'early' | 'explore'; label: string } {
  if (score >= 75) return { tier: 'high', label: 'High Readiness - Ready to Start' }
  if (score >= 60) return { tier: 'good', label: 'Good Potential - Nearly There' }
  if (score >= 45) return { tier: 'early', label: 'Early Stage - Foundation Needed' }
  return { tier: 'explore', label: 'Exploratory - Just Getting Started' }
}

// Convert tier to readiness level for database
function tierToReadinessLevel(tier: string): string {
  switch (tier) {
    case 'high': return 'leader'
    case 'good': return 'advanced'
    case 'early': return 'developing'
    case 'explore': return 'emerging'
    default: return 'emerging'
  }
}

// Save assessment to database
async function saveAssessmentToDatabase(results: AssessmentResults, extendedReport: ExtendedReportData) {
  try {
    const opportunities = extendedReport.automationOpportunities.map(opp => ({
      title: opp.process,
      description: `Automate ${opp.process} in ${opp.department}`,
      department: opp.department,
      complexity: opp.implementation === 'quick-win' ? 'low' : opp.implementation === 'medium-term' ? 'medium' : 'high',
      estimated_hours_saved_weekly: parseInt(opp.currentEffort.split('-')[0]) || 10,
      estimated_annual_savings: Math.round(extendedReport.costBenefit.projectedSavings / extendedReport.automationOpportunities.length),
      priority: opp.automationPotential >= 80 ? 'high' : opp.automationPotential >= 60 ? 'medium' : 'low',
      implementation_timeline: opp.implementation === 'quick-win' ? '1-2 weeks' : opp.implementation === 'medium-term' ? '1-2 months' : '3-6 months'
    }))

    const response = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overallScore: results.overallScore,
        readinessLevel: tierToReadinessLevel(results.tier),
        dimensionScores: results.dimensionScores,
        answers: results.answers,
        companyInfo: results.companyInfo,
        opportunities
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to save assessment:', error)
    return null
  }
}

function generateExtendedReport(results: AssessmentResults): ExtendedReportData {
  const { overallScore, dimensionScores, companyInfo } = results
  const readinessScore = overallScore
  
  return {
    readinessScore: {
      score: readinessScore,
      breakdown: {
        technical: dimensionScores.tech,
        organizational: dimensionScores.org,
        processMaturity: dimensionScores.process,
      },
    },
    riskIndex: {
      score: 100 - readinessScore,
      factors: [
        {
          name: 'Operational Inefficiency',
          severity: dimensionScores.process < 50 ? 'high' : dimensionScores.process < 70 ? 'medium' : 'low',
          description: 'Current manual processes create bottlenecks and increase error rates.',
        },
        {
          name: 'Technology Gaps',
          severity: dimensionScores.tech < 50 ? 'high' : dimensionScores.tech < 70 ? 'medium' : 'low',
          description: 'Legacy systems and limited API coverage hinder automation potential.',
        },
        {
          name: 'Change Resistance',
          severity: dimensionScores.org < 50 ? 'high' : dimensionScores.org < 70 ? 'medium' : 'low',
          description: 'Organizational readiness may slow adoption and implementation.',
        },
      ],
    },
    automationOpportunities: [
      {
        department: 'Operations',
        process: 'Invoice Processing',
        currentEffort: '15-20 hours/week',
        automationPotential: 85,
        estimatedROI: '300% in Year 1',
        implementation: 'quick-win',
      },
      {
        department: 'Customer Service',
        process: 'Ticket Triage & Response',
        currentEffort: '25-30 hours/week',
        automationPotential: 70,
        estimatedROI: '250% in Year 1',
        implementation: 'medium-term',
      },
      {
        department: 'Finance',
        process: 'Report Generation',
        currentEffort: '10-15 hours/week',
        automationPotential: 90,
        estimatedROI: '400% in Year 1',
        implementation: 'quick-win',
      },
      {
        department: 'HR',
        process: 'Employee Onboarding',
        currentEffort: '8-12 hours/new hire',
        automationPotential: 65,
        estimatedROI: '200% in Year 1',
        implementation: 'medium-term',
      },
      {
        department: 'Sales',
        process: 'Lead Qualification',
        currentEffort: '20+ hours/week',
        automationPotential: 75,
        estimatedROI: '350% in Year 1',
        implementation: 'long-term',
      },
    ],
    costBenefit: {
      currentAnnualCost: 250000,
      projectedSavings: Math.round(250000 * (readinessScore / 100) * 0.4),
      implementationCost: 35000,
      paybackPeriod: readinessScore >= 70 ? '4-6 months' : readinessScore >= 50 ? '6-9 months' : '9-12 months',
      fiveYearROI: Math.round(((250000 * (readinessScore / 100) * 0.4 * 5) / 35000) * 100),
    },
    techStack: [
      {
        category: 'RPA Platform',
        tool: 'UiPath or Automation Anywhere',
        description: 'Enterprise-grade robotic process automation for repetitive tasks',
        priority: 'essential',
      },
      {
        category: 'AI/ML Platform',
        tool: 'Microsoft Power Platform or Custom AI',
        description: 'Intelligent document processing and decision automation',
        priority: 'essential',
      },
      {
        category: 'Integration Hub',
        tool: 'Zapier or Make (Integromat)',
        description: 'Connect applications and automate workflows without code',
        priority: 'recommended',
      },
      {
        category: 'Analytics',
        tool: 'Power BI or Tableau',
        description: 'Real-time dashboards and automated reporting',
        priority: 'recommended',
      },
      {
        category: 'Customer Service',
        tool: 'Intercom or Zendesk with AI',
        description: 'AI-powered customer support and ticket automation',
        priority: 'nice-to-have',
      },
    ],
    actionPlan: [
      {
        phase: 'Discovery & Quick Wins',
        timeframe: 'Days 1-30',
        actions: [
          'Audit current manual processes and document workflows',
          'Identify top 3 quick-win automation opportunities',
          'Evaluate and select initial automation tools',
          'Implement first automated reporting dashboard',
        ],
        expectedOutcome: '10-15% efficiency improvement in targeted areas',
      },
      {
        phase: 'Foundation Building',
        timeframe: 'Days 31-60',
        actions: [
          'Deploy RPA for invoice and document processing',
          'Set up integration hub connecting core systems',
          'Launch AI chatbot for common customer inquiries',
          'Train team on new automation tools',
        ],
        expectedOutcome: '25-30% reduction in manual work hours',
      },
      {
        phase: 'Scale & Optimize',
        timeframe: 'Days 61-90',
        actions: [
          'Expand automation to additional departments',
          'Implement advanced analytics and predictions',
          'Refine workflows based on initial learnings',
          'Establish automation governance and best practices',
        ],
        expectedOutcome: 'Sustainable 40%+ efficiency gains',
      },
    ],
    benchmark: [
      {
        metric: 'Process Automation',
        yourScore: dimensionScores.process,
        industryAverage: 45,
        topPerformers: 85,
      },
      {
        metric: 'Technology Readiness',
        yourScore: dimensionScores.tech,
        industryAverage: 52,
        topPerformers: 88,
      },
      {
        metric: 'Organizational Readiness',
        yourScore: dimensionScores.org,
        industryAverage: 40,
        topPerformers: 82,
      },
      {
        metric: 'ROI Potential',
        yourScore: dimensionScores.roi,
        industryAverage: 48,
        topPerformers: 78,
      },
    ],
    disruptionRisk: {
      overallRisk: readinessScore < 50 ? 'high' : readinessScore < 70 ? 'medium' : 'low',
      affectedRoles: [
        {
          role: 'Data Entry Specialists',
          riskLevel: 85,
          recommendation: 'Transition to data quality oversight and exception handling',
        },
        {
          role: 'Customer Service Reps (Tier 1)',
          riskLevel: 70,
          recommendation: 'Upskill for complex issue resolution and relationship management',
        },
        {
          role: 'Report Analysts',
          riskLevel: 60,
          recommendation: 'Evolve to strategic insights and decision support roles',
        },
        {
          role: 'Administrative Assistants',
          riskLevel: 55,
          recommendation: 'Focus on high-value coordination and strategic support',
        },
      ],
      timelineEstimate: '18-36 months for significant industry transformation',
    },
    roadmap: [
      {
        quarter: 'Q1',
        initiatives: [
          {
            name: 'Document Processing Automation',
            priority: 1,
            resources: '1 developer, RPA platform license',
            dependencies: [],
          },
          {
            name: 'Reporting Dashboard Setup',
            priority: 2,
            resources: 'BI tool, data integration',
            dependencies: [],
          },
        ],
      },
      {
        quarter: 'Q2',
        initiatives: [
          {
            name: 'AI Customer Service Bot',
            priority: 1,
            resources: 'AI platform, training data',
            dependencies: ['Knowledge base documentation'],
          },
          {
            name: 'System Integration Hub',
            priority: 2,
            resources: 'Integration platform, API access',
            dependencies: ['IT security review'],
          },
        ],
      },
      {
        quarter: 'Q3',
        initiatives: [
          {
            name: 'HR Process Automation',
            priority: 1,
            resources: 'HR platform upgrade, workflow design',
            dependencies: ['System Integration Hub'],
          },
          {
            name: 'Predictive Analytics',
            priority: 2,
            resources: 'ML models, historical data',
            dependencies: ['Reporting Dashboard Setup'],
          },
        ],
      },
      {
        quarter: 'Q4',
        initiatives: [
          {
            name: 'Full Workflow Optimization',
            priority: 1,
            resources: 'Process engineering, change management',
            dependencies: ['All Q1-Q3 initiatives'],
          },
          {
            name: 'Advanced AI Decision Support',
            priority: 2,
            resources: 'Custom AI development',
            dependencies: ['Predictive Analytics'],
          },
        ],
      },
    ],
    executiveSummary: {
      headline: `${companyInfo.companyName} has ${readinessScore >= 70 ? 'strong' : readinessScore >= 50 ? 'good' : 'emerging'} RPA readiness with significant automation potential`,
      keyFindings: [
        `Overall RPA readiness score: ${readinessScore}% (${readinessScore >= 75 ? 'Ready to start' : readinessScore >= 60 ? 'Nearly there' : readinessScore >= 45 ? 'Foundation needed' : 'Exploratory phase'})`,
        `Strongest dimension: ${Object.entries(dimensionScores).sort(([,a], [,b]) => b - a)[0][0].toUpperCase()} at ${Math.max(...Object.values(dimensionScores))}%`,
        `Estimated first-year ROI of ${Math.round(((250000 * (readinessScore / 100) * 0.4) / 35000) * 100)}%`,
        `Ukrainian RPA team can have bots live in ${readinessScore >= 70 ? '4-6' : readinessScore >= 50 ? '6-8' : '8-12'} weeks`,
      ],
      strategicRecommendations: [
        'Start with quick-win automations to build momentum and demonstrate value',
        'Invest in integration infrastructure to enable seamless data flow',
        'Partner with experienced Ukrainian RPA experts for cost-effective implementation',
        'Establish automation governance to ensure sustainable scaling',
      ],
      nextSteps: [
        'Schedule a detailed process mapping session with our experts',
        'Receive matched Ukrainian RPA team recommendations',
        'Build business case for executive approval',
        'Initiate pilot project in highest-impact area',
      ],
    },
  }
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  step: 'info',
  currentQuestionIndex: 0,
  companyInfo: null,
  answers: [],
  results: null,
  extendedReport: null,
  hasPurchasedExtended: false,
  
  setCompanyInfo: (info) => {
    set({ companyInfo: info, step: 'questions' })
  },
  
  answerQuestion: (questionId, value) => {
    const { answers } = get()
    const existingIndex = answers.findIndex((a) => a.questionId === questionId)
    
    if (existingIndex >= 0) {
      const newAnswers = [...answers]
      newAnswers[existingIndex] = { questionId, value }
      set({ answers: newAnswers })
    } else {
      set({ answers: [...answers, { questionId, value }] })
    }
  },
  
  nextQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 })
    }
  },
  
  prevQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    }
  },
  
  calculateResults: () => {
    const { companyInfo, answers } = get()
    if (!companyInfo) return
    
    set({ step: 'analyzing' })
    
    // Simulate AI analysis time
    setTimeout(() => {
      const dimensionScores: DimensionScores = {
        process: calculateDimensionScore('process', answers),
        tech: calculateDimensionScore('tech', answers),
        org: calculateDimensionScore('org', answers),
        roi: calculateDimensionScore('roi', answers),
        size: calculateDimensionScore('size', answers),
      }
      
      const dims = ['process', 'tech', 'org', 'roi'] as const
      const overallScore = Math.round(
        dims.reduce((sum, dim) => sum + dimensionScores[dim], 0) / dims.length
      )
      
      const tierInfo = getTierInfo(overallScore)
      
      const results: AssessmentResults = {
        companyInfo,
        answers,
        overallScore,
        dimensionScores,
        tier: tierInfo.tier,
        tierLabel: tierInfo.label,
        advice: ADVICE_MAP[tierInfo.tier],
      }
      
      const extendedReport = generateExtendedReport(results)
      
      // Save to database (async, don't block UI)
      saveAssessmentToDatabase(results, extendedReport)
      
      set({ results, extendedReport, step: 'results' })
    }, 3000)
  },
  
  setStep: (step) => set({ step }),
  
  purchaseExtendedReport: () => {
    set({ hasPurchasedExtended: true })
  },
  
  reset: () => {
    set({
      step: 'info',
      currentQuestionIndex: 0,
      companyInfo: null,
      answers: [],
      results: null,
      extendedReport: null,
      hasPurchasedExtended: false,
    })
  },
}))
