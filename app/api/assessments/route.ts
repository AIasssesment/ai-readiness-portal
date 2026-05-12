import { createClient } from "@/lib/db-client/server"
import { NextResponse } from "next/server"
import { apiErrors } from "@/lib/http/api-errors"

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    
    const body = await request.json()
    const { 
      overallScore, 
      readinessLevel, 
      dimensionScores, 
      answers, 
      companyInfo,
      opportunities 
    } = body

    const contactName =
      companyInfo?.website?.trim() ||
      (companyInfo?.firstName ? `${companyInfo.firstName} ${companyInfo.lastName ?? ""}`.trim() : null)

    // If user is logged in, save to their account
    if (user) {
      // Get or create client record
      let { data: client } = await db
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!client) {
        // Create client record
        const { data: newClient, error: clientError } = await db
          .from("clients")
          .insert({
            user_id: user.id,
            company_name: companyInfo?.companyName || "Unknown",
            contact_name: contactName,
            contact_email: companyInfo?.email || user.email,
            industry: companyInfo?.industry || null,
            company_size: companyInfo?.employeeCount || null
          })
          .select()
          .single()

        if (clientError) {
          console.error("Error creating client:", clientError)
          return apiErrors.internal("Failed to create client")
        }
        client = newClient
      }

      // Update client info with latest assessment info
      await db
        .from("clients")
        .update({
          company_name: companyInfo?.companyName || client.company_name,
          contact_name: contactName || client.contact_name,
          industry: companyInfo?.industry || client.industry,
          company_size: companyInfo?.employeeCount || client.company_size
        })
        .eq("id", client.id)

      // Save assessment
      const { data: assessment, error: assessmentError } = await db
        .from("assessments")
        .insert({
          client_id: client.id,
          overall_score: overallScore,
          readiness_level: readinessLevel,
          dimension_scores: dimensionScores,
          answers: answers,
          company_info: companyInfo,
          status: "completed"
        })
        .select()
        .single()

      if (assessmentError) {
        console.error("Error saving assessment:", assessmentError)
        return apiErrors.internal("Failed to save assessment")
      }

      // Save opportunities if provided
      if (opportunities && opportunities.length > 0) {
        const opportunitiesWithIds = opportunities.map((opp: {
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
          client_id: client.id,
          title: opp.title,
          description: opp.description || null,
          department: opp.department || null,
          complexity: opp.complexity || "medium",
          estimated_hours_saved_weekly: opp.estimated_hours_saved_weekly || 0,
          estimated_annual_savings: opp.estimated_annual_savings || 0,
          priority: opp.priority || "medium",
          implementation_timeline: opp.implementation_timeline || null,
          status: "identified"
        }))

        const { error: oppError } = await db
          .from("opportunities")
          .insert(opportunitiesWithIds)

        if (oppError) {
          console.error("Error saving opportunities:", oppError)
        }
      }

      return NextResponse.json({ 
        success: true, 
        assessmentId: assessment.id,
        clientId: client.id,
        message: "Assessment saved to your account"
      })
    }

    // For non-authenticated users, just return success without saving
    return NextResponse.json({ 
      success: true, 
      message: "Assessment completed. Sign in to save your results."
    })

  } catch (error) {
    console.error("Assessment API error:", error)
    return apiErrors.internal("Internal server error")
  }
}

export async function GET() {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()

    if (!user) {
      return apiErrors.unauthorized()
    }

    // Get client
    const { data: client } = await db
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!client) {
      return NextResponse.json({ assessments: [] })
    }

    // Get assessments
    const { data: assessments, error } = await db
      .from("assessments")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching assessments:", error)
      return apiErrors.internal("Failed to fetch assessments")
    }

    return NextResponse.json({ assessments })

  } catch (error) {
    console.error("Assessment API error:", error)
    return apiErrors.internal("Internal server error")
  }
}
