import { createClient } from "@/lib/db-client/server"
import { NextResponse } from "next/server"

type ClientRow = {
  id: string
  company_name: string
  contact_name: string | null
  contact_email: string
  website: string | null
  description: string | null
}

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const {
      data: { user },
    } = await db.auth.getUser()

    const body = await request.json()
    const {
      overallScore,
      readinessLevel,
      dimensionScores,
      answers,
      companyInfo,
      opportunities,
    } = body

    // If user is logged in, save to their account
    if (user) {
      const existing = await db.from("clients").select().eq("user_id", user.id).single()

      let client = (existing.data ?? null) as unknown as ClientRow | null

      const website =
        typeof companyInfo?.website === "string" && companyInfo.website.trim()
          ? companyInfo.website.trim()
          : null
      const description =
        typeof companyInfo?.description === "string" && companyInfo.description.trim()
          ? companyInfo.description.trim()
          : null
      // Prefer display name; avoid overwriting company_name with a raw website URL
      const displayCompanyName =
        typeof companyInfo?.companyName === "string" &&
        companyInfo.companyName.trim() &&
        !/^https?:\/\//i.test(companyInfo.companyName.trim()) &&
        !/^\S+\.\S+$/.test(companyInfo.companyName.trim())
          ? companyInfo.companyName.trim()
          : null

      if (!client) {
        const { data: newClient, error: clientError } = await db
          .from("clients")
          .insert({
            user_id: user.id,
            company_name: displayCompanyName || companyInfo?.companyName || "Unknown",
            contact_name: companyInfo?.firstName
              ? `${companyInfo.firstName} ${companyInfo.lastName}`
              : null,
            contact_email: companyInfo?.email || user.email,
            website,
            description,
          })
          .select()
          .single()

        if (clientError) {
          console.error("Error creating client:", clientError)
          return NextResponse.json({ error: "Failed to create client" }, { status: 500 })
        }
        client = newClient as ClientRow
      }

      // Update the client profile from the latest assessment.
      await db
        .from("clients")
        .update({
          company_name: displayCompanyName || client.company_name,
          contact_name: companyInfo?.firstName
            ? `${companyInfo.firstName} ${companyInfo.lastName}`
            : client.contact_name,
          website: website || client.website || null,
          description: description || client.description || null,
        })
        .eq("id", client.id)

      const { data: assessment, error: assessmentError } = await db
        .from("assessments")
        .insert({
          client_id: client.id,
          overall_score: overallScore,
          readiness_level: readinessLevel,
          dimension_scores: dimensionScores,
          answers: answers,
          company_info: companyInfo,
          status: "completed",
        })
        .select()
        .single()

      if (assessmentError) {
        console.error("Error saving assessment:", assessmentError)
        return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 })
      }

      if (opportunities && opportunities.length > 0) {
        const opportunitiesWithIds = opportunities.map(
          (opp: {
            title: string
            description?: string
            department?: string
            complexity?: string
            estimated_hours_saved_weekly?: number
            estimated_annual_savings?: number
            priority?: string
            implementation_timeline?: string
          }) => ({
            assessment_id: assessment.id,
            client_id: client!.id,
            title: opp.title,
            description: opp.description || null,
            department: opp.department || null,
            complexity: opp.complexity || "medium",
            estimated_hours_saved_weekly: opp.estimated_hours_saved_weekly || 0,
            estimated_annual_savings: opp.estimated_annual_savings || 0,
            priority: opp.priority || "medium",
            implementation_timeline: opp.implementation_timeline || null,
            status: "identified",
          }),
        )

        const { error: oppError } = await db.from("opportunities").insert(opportunitiesWithIds)

        if (oppError) {
          console.error("Error saving opportunities:", oppError)
        }
      }

      return NextResponse.json({
        success: true,
        assessmentId: assessment.id,
        clientId: client.id,
        message: "Assessment saved to your account",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Assessment completed. Sign up to save your results!",
    })
  } catch (error) {
    console.error("Assessment save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = await createClient()
    const {
      data: { user },
    } = await db.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: client } = await db.from("clients").select().eq("user_id", user.id).single()

    if (!client) {
      return NextResponse.json({ assessments: [] })
    }

    const typedClient = client as unknown as ClientRow

    const { data: assessments, error } = await db
      .from("assessments")
      .select()
      .eq("client_id", typedClient.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching assessments:", error)
      return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 })
    }

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error("Assessments fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
