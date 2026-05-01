"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type WorkforceRole = {
  id: string
  role_title: string
  department: string | null
  employee_count: number
}

export function WorkforceManager() {
  const [roles, setRoles] = useState<WorkforceRole[]>([])
  const [roleTitle, setRoleTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [employeeCount, setEmployeeCount] = useState("")
  const [loading, setLoading] = useState(false)

  const loadRoles = async () => {
    const response = await fetch("/api/workforce/roles")
    if (!response.ok) return
    const data = (await response.json()) as { roles?: WorkforceRole[] }
    setRoles(data.roles ?? [])
  }

  useEffect(() => {
    loadRoles()
  }, [])

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const count = Number(employeeCount)
    if (!roleTitle.trim() || Number.isNaN(count) || count < 0) return

    setLoading(true)
    const response = await fetch("/api/workforce/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_title: roleTitle.trim(),
        department: department.trim() || null,
        employee_count: count,
      }),
    })
    setLoading(false)
    if (!response.ok) return

    setRoleTitle("")
    setDepartment("")
    setEmployeeCount("")
    loadRoles()
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/workforce/roles/${id}`, { method: "DELETE" })
    if (!response.ok) return
    loadRoles()
  }

  const totalEmployees = roles.reduce((sum, role) => sum + role.employee_count, 0)

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Workforce Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-4">
          <Input
            value={roleTitle}
            onChange={(event) => setRoleTitle(event.target.value)}
            placeholder="Job title (e.g. Customer Support Rep)"
            className="md:col-span-2"
          />
          <Input
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Department"
          />
          <Input
            value={employeeCount}
            onChange={(event) => setEmployeeCount(event.target.value)}
            type="number"
            min={0}
            placeholder="Employees"
          />
          <Button type="submit" disabled={loading} className="md:col-span-4 md:justify-self-end">
            {loading ? "Saving..." : "Add / Update Role"}
          </Button>
        </form>

        <div className="rounded-lg border border-border/40">
          <div className="flex items-center justify-between border-b border-border/40 px-3 py-2 text-sm">
            <span className="font-medium">Current workforce roles</span>
            <span className="text-muted-foreground">{totalEmployees.toLocaleString()} total employees</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {roles.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No roles added yet.</p>
            ) : (
              <ul className="divide-y divide-border/30">
                {roles.map((role) => (
                  <li key={role.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{role.role_title}</p>
                      <p className="text-xs text-muted-foreground">{role.department || "Unassigned department"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{role.employee_count.toLocaleString()}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
