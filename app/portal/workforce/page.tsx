import { redirect } from "next/navigation"

/** Manual workforce UI removed — roles come from LinkedIn enrichment / job-risk. */
export default function WorkforcePage() {
  redirect("/portal/job-risk")
}
