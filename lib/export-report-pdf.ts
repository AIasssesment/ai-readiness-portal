import type { AssessmentResults, ExtendedReportData } from "@/lib/types"

export type ExportReportPdfOptions = {
  report: ExtendedReportData
  results: AssessmentResults
  filename: string
}

type JsPdfDoc = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
  setFont: (font: string, style?: string) => void
  setFontSize: (size: number) => void
  setTextColor: (r: number, g: number, b: number) => void
  setDrawColor: (r: number, g: number, b: number) => void
  setFillColor: (r: number, g: number, b: number) => void
  text: (
    text: string | string[],
    x: number,
    y: number,
    options?: { align?: "left" | "center" | "right"; maxWidth?: number },
  ) => void
  splitTextToSize: (text: string, maxWidth: number, options?: object) => string[]
  line: (x1: number, y1: number, x2: number, y2: number) => void
  rect: (x: number, y: number, w: number, h: number, style?: string) => void
  roundedRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    ry: number,
    style?: string,
  ) => void
  addPage: () => void
  setPage: (page: number) => void
  getNumberOfPages: () => number
  addFileToVFS: (filename: string, filecontent: string) => void
  addFont: (postScriptName: string, fontName: string, fontStyle: string) => void
  save: (filename: string) => void
}

type JsPdfConstructor = new (options: {
  orientation: "portrait" | "landscape"
  unit: "mm"
  format: "a4"
}) => JsPdfDoc

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 16
const FOOTER_H = 12
const CONTENT_W = PAGE_W - MARGIN * 2
const FONT = "NotoSans"

const COLORS = {
  brand: [13, 148, 136] as const,
  brandDark: [15, 118, 110] as const,
  title: [17, 24, 39] as const,
  body: [55, 65, 81] as const,
  muted: [107, 114, 128] as const,
  line: [226, 232, 240] as const,
  panel: [248, 250, 252] as const,
  highlight: [240, 253, 250] as const,
  white: [255, 255, 255] as const,
  barMuted: [148, 163, 184] as const,
  barAccent: [45, 212, 191] as const,
}

const FONT_REGULAR_URL = "/fonts/NotoSans-Regular.ttf"

let fontCache: string | null = null

/**
 * Build a document PDF from report data (text + tables, white background).
 */
export async function exportExtendedReportToPdf({
  report,
  results,
  filename,
}: ExportReportPdfOptions): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in the browser")
  }

  const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js")
  const pdf = new (jsPDF as unknown as JsPdfConstructor)({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  await ensurePdfFonts(pdf)

  const builder = new ReportPdfBuilder(pdf)
  const company = results.companyInfo.companyName || "Company"
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  builder.addCover(company, date)
  builder.addSection("Executive Summary")
  builder.addHighlight(report.executiveSummary.headline)

  builder.addSubsection("Key Findings")
  builder.addBulletList(report.executiveSummary.keyFindings)
  builder.addSubsection("Strategic Recommendations")
  builder.addBulletList(report.executiveSummary.strategicRecommendations)

  builder.addSubsection("Next Steps")
  builder.addNumberedList(report.executiveSummary.nextSteps)

  builder.addSection("Scores Overview")
  builder.addScoreCards([
    {
      label: "Automation Readiness",
      value: `${report.readinessScore.score}%`,
      accent: true,
    },
    { label: "Risk Index", value: `${report.riskIndex.score}/100`, accent: false },
  ])
  for (const [key, value] of Object.entries(report.readinessScore.breakdown)) {
    const label = capitalize(key.replace(/([A-Z])/g, " $1").trim())
    builder.addProgressBar(label, value, COLORS.brand)
  }

  builder.addSubsection("Risk Factors")
  for (const factor of report.riskIndex.factors) {
    builder.addTagRow(factor.name, factor.severity)
    builder.addParagraph(factor.description)
  }

  builder.addSection("Top Automation Opportunities")
  builder.addTable(
    ["Department", "Process", "Effort", "Potential", "ROI", "Timeline"],
    report.automationOpportunities.map((opp) => [
      opp.department,
      opp.process,
      opp.currentEffort,
      `${opp.automationPotential}%`,
      opp.estimatedROI,
      opp.implementation.replace("-", " "),
    ]),
  )

  builder.addSection("Cost-Benefit Analysis")
  const { costBenefit } = report
  builder.addStatGrid([
    { label: "Current annual cost", value: formatMoney(costBenefit.currentAnnualCost) },
    { label: "Projected savings", value: formatMoney(costBenefit.projectedSavings), accent: true },
    { label: "Implementation cost", value: formatMoney(costBenefit.implementationCost) },
    { label: "Payback period", value: costBenefit.paybackPeriod, accent: true },
    { label: "5-year ROI", value: `${costBenefit.fiveYearROI}%`, accent: true },
  ])

  builder.addSection("Recommended Tech Stack")
  for (const item of report.techStack) {
    builder.addTechCard(item.tool, item.category, item.priority, item.description)
  }

  builder.addSection("90-Day Action Plan")
  report.actionPlan.forEach((phase, index) => {
    builder.addPhaseCard(
      index + 1,
      phase.phase,
      phase.timeframe,
      phase.actions,
      phase.expectedOutcome,
    )
  })

  builder.addSection("Benchmarks")
  for (const item of report.benchmark) {
    builder.addSubsection(item.metric)
    builder.addProgressBar("Your score", item.yourScore, COLORS.brand)
    builder.addProgressBar("Industry average", item.industryAverage, COLORS.barMuted)
    builder.addProgressBar("Top performers", item.topPerformers, COLORS.barAccent)
    builder.addGap(2)
  }

  builder.addSection("AI Disruption Risk")
  builder.addTagRow("Overall risk", report.disruptionRisk.overallRisk)
  builder.addParagraph(report.disruptionRisk.timelineEstimate)
  builder.addSubsection("Roles at Risk")
  for (const role of report.disruptionRisk.affectedRoles) {
    builder.addRoleCard(role.role, role.riskLevel, role.recommendation)
  }

  builder.addSection("Implementation Roadmap")
  builder.addRoadmap(report.roadmap)

  builder.addFooters(company)
  builder.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}

async function ensurePdfFonts(pdf: JsPdfDoc) {
  if (!fontCache) {
    fontCache = await fetchFontAsBase64(FONT_REGULAR_URL)
  }

  pdf.addFileToVFS("NotoSans-Regular.ttf", fontCache)
  pdf.addFont("NotoSans-Regular.ttf", FONT, "normal")
  pdf.addFont("NotoSans-Regular.ttf", FONT, "bold")
}

async function fetchFontAsBase64(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load font from ${url}`)
  }
  const buffer = await response.arrayBuffer()
  return arrayBufferToBase64(buffer)
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

class ReportPdfBuilder {
  private y = MARGIN

  constructor(private readonly pdf: JsPdfDoc) {}

  save(filename: string) {
    this.pdf.save(filename)
  }

  addCover(company: string, date: string) {
    this.fillRgb(COLORS.brand)
    this.pdf.rect(0, 0, PAGE_W, 46, "F")

    this.textRgb(COLORS.white)
    this.setFont("bold", 22)
    this.pdf.text("AI Readiness Report", MARGIN, 18)

    this.setFont("bold", 15)
    const companyLines = this.pdf.splitTextToSize(company, CONTENT_W)
    this.pdf.text(companyLines, MARGIN, 30)

    this.setFont("normal", 10)
    this.pdf.text(`Extended automation blueprint · ${date}`, MARGIN, 40)

    this.y = 56
    this.textRgb(COLORS.muted)
    this.setFont("normal", 9)
    this.pdf.text("Confidential business assessment", MARGIN, this.y)
    this.y += 8
  }

  addSection(title: string) {
    this.ensureSpace(16)
    this.fillRgb(COLORS.brand)
    this.pdf.rect(MARGIN, this.y - 5, 3, 9, "F")

    this.textRgb(COLORS.brandDark)
    this.setFont("bold", 14)
    this.pdf.text(title, MARGIN + 6, this.y + 1)
    this.y += 4

    this.drawRgb(COLORS.line)
    this.pdf.line(MARGIN, this.y, PAGE_W - MARGIN, this.y)
    this.y += 8
  }

  addSubsection(title: string) {
    this.ensureSpace(10)
    this.textRgb(COLORS.title)
    this.setFont("bold", 11)
    const lines = this.pdf.splitTextToSize(title, CONTENT_W)
    this.pdf.text(lines, MARGIN, this.y)
    this.y += lines.length * 5 + 3
  }

  addHighlight(text: string) {
    const pad = 5
    const textW = CONTENT_W - pad * 2 - 3
    this.setFont("normal", 11)
    const lines = this.pdf.splitTextToSize(text, textW)
    const lineH = 5.2
    const boxH = lines.length * lineH + pad * 2

    this.ensureSpace(boxH + 4)
    const boxY = this.y

    this.fillRgb(COLORS.highlight)
    this.pdf.roundedRect(MARGIN, boxY, CONTENT_W, boxH, 2, 2, "F")
    this.fillRgb(COLORS.brand)
    this.pdf.rect(MARGIN, boxY, 3, boxH, "F")

    this.textRgb(COLORS.title)
    this.pdf.text(lines, MARGIN + pad + 3, boxY + pad + 4)
    this.y = boxY + boxH + 6
  }

  addParagraph(text: string) {
    this.ensureSpace(8)
    this.textRgb(COLORS.body)
    this.setFont("normal", 10)
    const lines = this.pdf.splitTextToSize(text, CONTENT_W)
    this.pdf.text(lines, MARGIN, this.y)
    this.y += lines.length * 4.8 + 2
  }

  addBulletList(items: string[]) {
    for (const item of items) {
      this.ensureSpace(8)
      this.textRgb(COLORS.body)
      this.setFont("normal", 10)
      const lines = this.pdf.splitTextToSize(item, CONTENT_W - 8)
      this.pdf.text("•", MARGIN + 1, this.y)
      this.pdf.text(lines, MARGIN + 5, this.y)
      this.y += lines.length * 4.8 + 2
    }
    this.y += 2
  }

  addNumberedList(items: string[]) {
    items.forEach((item, index) => {
      this.ensureSpace(8)
      this.textRgb(COLORS.body)
      this.setFont("normal", 10)
      const lines = this.pdf.splitTextToSize(item, CONTENT_W - 10)
      this.pdf.text(`${index + 1}.`, MARGIN + 1, this.y)
      this.pdf.text(lines, MARGIN + 7, this.y)
      this.y += lines.length * 4.8 + 2
    })
    this.y += 2
  }

  addGap(mm: number) {
    this.y += mm
  }

  addScoreCards(cards: { label: string; value: string; accent?: boolean }[]) {
    const gap = 4
    const cardW = (CONTENT_W - gap) / 2
    const cardH = 22

    this.ensureSpace(cardH + 4)
    cards.forEach((card, index) => {
      const x = MARGIN + index * (cardW + gap)
      const y = this.y

      this.fillRgb(COLORS.panel)
      this.pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F")
      this.drawRgb(COLORS.line)
      this.pdf.roundedRect(x, y, cardW, cardH, 2, 2, "S")

      this.textRgb(COLORS.muted)
      this.setFont("normal", 9)
      this.pdf.text(card.label, x + 4, y + 8)

      this.textRgb(card.accent ? COLORS.brand : COLORS.title)
      this.setFont("bold", 18)
      this.pdf.text(card.value, x + 4, y + 17)
    })

    this.y += cardH + 6
  }

  addStatGrid(stats: { label: string; value: string; accent?: boolean }[]) {
    const cols = 3
    const gap = 4
    const cardW = (CONTENT_W - gap * (cols - 1)) / cols
    const cardH = 18

    for (let i = 0; i < stats.length; i += cols) {
      const row = stats.slice(i, i + cols)
      this.ensureSpace(cardH + 4)

      row.forEach((stat, index) => {
        const x = MARGIN + index * (cardW + gap)
        const y = this.y

        this.fillRgb(COLORS.panel)
        this.pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F")

        this.textRgb(COLORS.muted)
        this.setFont("normal", 8)
        const labelLines = this.pdf.splitTextToSize(stat.label, cardW - 6)
        this.pdf.text(labelLines, x + 3, y + 6)

        this.textRgb(stat.accent ? COLORS.brand : COLORS.title)
        this.setFont("bold", 11)
        this.pdf.text(stat.value, x + 3, y + 14)
      })

      this.y += cardH + 4
    }
    this.y += 2
  }

  addProgressBar(
    label: string,
    percent: number,
    color: readonly [number, number, number],
  ) {
    this.ensureSpace(9)
    const labelW = 40
    const barX = MARGIN + labelW
    const barW = CONTENT_W - labelW - 14
    const barY = this.y - 3

    this.textRgb(COLORS.body)
    this.setFont("normal", 9)
    this.pdf.text(label, MARGIN, this.y)

    this.fillRgb(COLORS.line)
    this.pdf.roundedRect(barX, barY, barW, 3.5, 1, 1, "F")

    const fillW = Math.max(1.5, (barW * percent) / 100)
    this.fillRgb(color)
    this.pdf.roundedRect(barX, barY, fillW, 3.5, 1, 1, "F")

    this.textRgb(COLORS.title)
    this.setFont("bold", 9)
    this.pdf.text(`${percent}%`, barX + barW + 3, this.y)

    this.y += 7
  }

  addTagRow(label: string, tag: string) {
    this.ensureSpace(8)
    this.textRgb(COLORS.title)
    this.setFont("bold", 10)
    this.pdf.text(label, MARGIN, this.y)

    const tagW = 24
    const tagX = PAGE_W - MARGIN - tagW
    this.fillRgb(COLORS.highlight)
    this.pdf.roundedRect(tagX, this.y - 4.5, tagW, 7, 2, 2, "F")
    this.textRgb(COLORS.brandDark)
    this.setFont("bold", 8)
    this.pdf.text(tag.toUpperCase(), tagX + 3, this.y)
    this.y += 7
  }

  addTechCard(
    tool: string,
    category: string,
    priority: string,
    description: string,
  ) {
    this.ensureSpace(22)
    const boxY = this.y

    this.fillRgb(COLORS.panel)
    this.pdf.roundedRect(MARGIN, boxY, CONTENT_W, 20, 2, 2, "F")
    this.drawRgb(COLORS.line)
    this.pdf.roundedRect(MARGIN, boxY, CONTENT_W, 20, 2, 2, "S")

    this.textRgb(COLORS.title)
    this.setFont("bold", 10)
    this.pdf.text(tool, MARGIN + 4, boxY + 7)

    this.textRgb(COLORS.muted)
    this.setFont("normal", 8)
    this.pdf.text(`${category} · ${priority.replace("-", " ")}`, MARGIN + 4, boxY + 12)

    this.textRgb(COLORS.body)
    this.setFont("normal", 9)
    const desc = this.pdf.splitTextToSize(description, CONTENT_W - 8)
    this.pdf.text(desc.slice(0, 2), MARGIN + 4, boxY + 17)

    this.y = boxY + 24
  }

  addPhaseCard(
    index: number,
    phase: string,
    timeframe: string,
    actions: string[],
    outcome: string,
  ) {
    this.addSubsection(`Phase ${index}: ${phase}`)
    this.addTagRow("Timeframe", timeframe)
    this.addBulletList(actions)
    this.textRgb(COLORS.brandDark)
    this.setFont("bold", 9)
    this.pdf.text("Expected outcome", MARGIN, this.y)
    this.y += 5
    this.addParagraph(outcome)
    this.addGap(2)
  }

  addRoleCard(role: string, risk: number, recommendation: string) {
    this.ensureSpace(18)
    const boxY = this.y

    this.fillRgb(COLORS.panel)
    this.pdf.roundedRect(MARGIN, boxY, CONTENT_W, 16, 2, 2, "F")

    this.textRgb(COLORS.title)
    this.setFont("bold", 10)
    this.pdf.text(role, MARGIN + 4, boxY + 7)

    this.textRgb(COLORS.brand)
    this.setFont("bold", 10)
    this.pdf.text(`${risk}%`, PAGE_W - MARGIN - 12, boxY + 7)

    this.textRgb(COLORS.body)
    this.setFont("normal", 9)
    const rec = this.pdf.splitTextToSize(recommendation, CONTENT_W - 8)
    this.pdf.text(rec.slice(0, 2), MARGIN + 4, boxY + 12)

    this.y = boxY + 20
  }

  addRoadmap(
    quarters: {
      quarter: string
      initiatives: {
        name: string
        priority: number
        resources: string
        dependencies: string[]
      }[]
    }[],
  ) {
    const gap = 4
    const cols = 2
    const cardW = (CONTENT_W - gap) / cols
    const pad = 4
    const innerW = cardW - pad * 2

    for (let i = 0; i < quarters.length; i += cols) {
      const row = quarters.slice(i, i + cols)
      const heights = row.map((quarter) =>
        this.measureRoadmapCardHeight(quarter, innerW, pad),
      )
      const rowH = Math.max(...heights)

      this.ensureSpace(rowH + 4)

      row.forEach((quarter, index) => {
        const x = MARGIN + index * (cardW + gap)
        this.drawRoadmapCard(quarter, x, this.y, cardW, rowH, pad, innerW)
      })

      this.y += rowH + gap
    }

    this.y += 2
  }

  private measureRoadmapCardHeight(
    quarter: {
      quarter: string
      initiatives: {
        name: string
        priority: number
        resources: string
        dependencies: string[]
      }[]
    },
    innerW: number,
    pad: number,
  ) {
    let h = pad + 10

    for (const init of quarter.initiatives) {
      this.setFont("bold", 9)
      const nameLines = this.pdf.splitTextToSize(init.name, innerW - 14)
      this.setFont("normal", 8)
      const resourceLines = this.pdf.splitTextToSize(
        `Resources: ${init.resources}`,
        innerW,
      )
      const depLines =
        init.dependencies.length > 0
          ? this.pdf.splitTextToSize(
              `Depends on: ${init.dependencies.join(", ")}`,
              innerW,
            )
          : []

      h += 6 + nameLines.length * 3.8 + 2 + resourceLines.length * 3.4
      if (depLines.length > 0) h += depLines.length * 3.4 + 1
      h += 5
    }

    return h + pad
  }

  private drawRoadmapCard(
    quarter: {
      quarter: string
      initiatives: {
        name: string
        priority: number
        resources: string
        dependencies: string[]
      }[]
    },
    x: number,
    y: number,
    cardW: number,
    cardH: number,
    pad: number,
    innerW: number,
  ) {
    this.fillRgb(COLORS.panel)
    this.pdf.roundedRect(x, y, cardW, cardH, 2, 2, "F")
    this.drawRgb(COLORS.line)
    this.pdf.roundedRect(x, y, cardW, cardH, 2, 2, "S")
    this.fillRgb(COLORS.brand)
    this.pdf.rect(x, y, 3, cardH, "F")

    this.textRgb(COLORS.brandDark)
    this.setFont("bold", 12)
    this.pdf.text(quarter.quarter, x + pad + 2, y + pad + 6)

    let cursorY = y + pad + 12

    for (const init of quarter.initiatives) {
      const badgeW = 10
      this.fillRgb(COLORS.highlight)
      this.pdf.roundedRect(x + pad + 2, cursorY - 3.5, badgeW, 5.5, 1, 1, "F")
      this.textRgb(COLORS.brandDark)
      this.setFont("bold", 7)
      this.pdf.text(`P${init.priority}`, x + pad + 3.5, cursorY)

      this.textRgb(COLORS.title)
      this.setFont("bold", 9)
      const nameLines = this.pdf.splitTextToSize(init.name, innerW - 14)
      this.pdf.text(nameLines, x + pad + 14, cursorY)
      cursorY += nameLines.length * 3.8 + 2

      this.textRgb(COLORS.body)
      this.setFont("normal", 8)
      const resourceLines = this.pdf.splitTextToSize(
        `Resources: ${init.resources}`,
        innerW,
      )
      this.pdf.text(resourceLines, x + pad + 2, cursorY)
      cursorY += resourceLines.length * 3.4 + 1

      if (init.dependencies.length > 0) {
        this.textRgb(COLORS.muted)
        const depLines = this.pdf.splitTextToSize(
          `Depends on: ${init.dependencies.join(", ")}`,
          innerW,
        )
        this.pdf.text(depLines, x + pad + 2, cursorY)
        cursorY += depLines.length * 3.4 + 1
      }

      cursorY += 4
    }
  }

  addTable(headers: string[], rows: string[][]) {
    const colWidths = [30, 42, 24, 20, 24, 38]
    const fontSize = 8
    const rowPad = 3
    const headerH = 8

    this.ensureSpace(headerH + 8)
    this.drawTableRow(headers, colWidths, fontSize, true, headerH)
    this.y += headerH

    rows.forEach((row, rowIndex) => {
      const cellLines = row.map((cell, i) =>
        this.pdf.splitTextToSize(cell, colWidths[i] - 3),
      )
      const rowLines = Math.max(...cellLines.map((lines) => lines.length), 1)
      const rowH = rowLines * 3.8 + rowPad * 2

      this.ensureSpace(rowH + 2)
      this.drawTableRow(row, colWidths, fontSize, false, rowH, cellLines, rowIndex)
      this.y += rowH
    })

    this.y += 4
  }

  addFooters(company: string) {
    const total = this.pdf.getNumberOfPages()
    for (let page = 1; page <= total; page++) {
      this.pdf.setPage(page)
      this.drawRgb(COLORS.line)
      this.pdf.line(MARGIN, PAGE_H - FOOTER_H, PAGE_W - MARGIN, PAGE_H - FOOTER_H)
      this.textRgb(COLORS.muted)
      this.setFont("normal", 8)
      this.pdf.text(company, MARGIN, PAGE_H - 5)
      this.pdf.text(`Page ${page} of ${total}`, PAGE_W - MARGIN, PAGE_H - 5, {
        align: "right",
      })
    }
  }

  private drawTableRow(
    cells: string[],
    colWidths: number[],
    fontSize: number,
    isHeader: boolean,
    rowH: number,
    cellLines?: string[][],
    rowIndex = 0,
  ) {
    const top = this.y - 5

    if (isHeader) {
      this.fillRgb(COLORS.brandDark)
      this.pdf.rect(MARGIN, top, CONTENT_W, rowH, "F")
    } else if (rowIndex % 2 === 0) {
      this.fillRgb(COLORS.panel)
      this.pdf.rect(MARGIN, top, CONTENT_W, rowH, "F")
    }

    this.drawRgb(COLORS.line)
    this.pdf.rect(MARGIN, top, CONTENT_W, rowH)

    this.setFont(isHeader ? "bold" : "normal", fontSize)
    this.textRgb(isHeader ? COLORS.white : COLORS.body)

    let x = MARGIN
    cells.forEach((cell, index) => {
      const width = colWidths[index]
      const lines =
        cellLines?.[index] ?? this.pdf.splitTextToSize(cell, width - 3)
      this.pdf.text(lines, x + 2, this.y)
      x += width
    })
  }

  private ensureSpace(height: number) {
    if (this.y + height > PAGE_H - MARGIN - FOOTER_H) {
      this.pdf.addPage()
      this.y = MARGIN
    }
  }

  private setFont(style: "normal" | "bold", size: number) {
    this.pdf.setFont(FONT, style)
    this.pdf.setFontSize(size)
  }

  private textRgb([r, g, b]: readonly [number, number, number]) {
    this.pdf.setTextColor(r, g, b)
  }

  private fillRgb([r, g, b]: readonly [number, number, number]) {
    this.pdf.setFillColor(r, g, b)
  }

  private drawRgb([r, g, b]: readonly [number, number, number]) {
    this.pdf.setDrawColor(r, g, b)
  }
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US")}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
