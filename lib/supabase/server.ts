import { getSessionUser } from "@/lib/auth/session"
import { sql } from "@/lib/db"

type Filter = { column: string; value: unknown }
type Ordering = { column: string; ascending: boolean }
type TableName = "clients" | "assessments" | "opportunities"

const ALLOWED_COLUMNS: Record<TableName, Set<string>> = {
  clients: new Set([
    "id",
    "user_id",
    "company_name",
    "contact_name",
    "contact_email",
    "industry",
    "company_size",
    "created_at",
    "updated_at",
  ]),
  assessments: new Set([
    "id",
    "client_id",
    "overall_score",
    "readiness_level",
    "dimension_scores",
    "answers",
    "company_info",
    "status",
    "created_at",
    "updated_at",
  ]),
  opportunities: new Set([
    "id",
    "assessment_id",
    "client_id",
    "title",
    "description",
    "department",
    "complexity",
    "estimated_hours_saved_weekly",
    "estimated_annual_savings",
    "priority",
    "implementation_timeline",
    "status",
    "notes",
    "created_at",
    "updated_at",
  ]),
}

class TableQuery {
  private filters: Filter[] = []
  private orderBy: Ordering[] = []
  private limitValue: number | null = null
  private singleMode = false
  private pendingUpdate: Record<string, unknown> | null = null

  constructor(private readonly tableName: TableName) {}

  select() {
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  limit(value: number) {
    this.limitValue = value
    return this
  }

  single() {
    this.singleMode = true
    return this.executeSelect()
  }

  async then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return (this.executeSelect() as Promise<{ data: any; error: null }>).then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    )
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    const rows = Array.isArray(payload) ? payload : [payload]
    return {
      select: () => ({
        single: async () => {
          const inserted = await this.insertRows(rows)
          return { data: inserted[0] ?? null, error: null }
        },
      }),
      then: async (
        onfulfilled?: ((value: { data: unknown[]; error: null }) => unknown) | null,
        onrejected?: ((reason: unknown) => unknown) | null,
      ) => {
        const data = await this.insertRows(rows)
        const value = { data, error: null as null }
        return Promise.resolve(value).then(onfulfilled ?? undefined, onrejected ?? undefined)
      },
    }
  }

  update(payload: Record<string, unknown>) {
    this.pendingUpdate = payload
    return this
  }

  private async executeSelect() {
    const rows = await this.fetchRows()
    if (this.singleMode) {
      return { data: rows[0] ?? null, error: null }
    }
    return { data: rows, error: null }
  }

  private assertColumnAllowed(column: string) {
    if (!ALLOWED_COLUMNS[this.tableName].has(column)) {
      throw new Error(`Column "${column}" is not allowed for table "${this.tableName}"`)
    }
  }

  private buildWhereClause(values: unknown[]) {
    if (this.filters.length === 0) return ""

    const clauses = this.filters.map((filter) => {
      this.assertColumnAllowed(filter.column)
      values.push(filter.value)
      return `"${filter.column}" = $${values.length}`
    })

    return ` where ${clauses.join(" and ")}`
  }

  private async fetchRows() {
    const values: any[] = []
    const whereClause = this.buildWhereClause(values)

    if (this.pendingUpdate) {
      const setEntries = Object.entries(this.pendingUpdate)
      if (setEntries.length === 0) return []

      const setClauses = setEntries.map(([column, value]) => {
        this.assertColumnAllowed(column)
        values.push(value)
        return `"${column}" = $${values.length}`
      })

      const query = `update "${this.tableName}" set ${setClauses.join(", ")}, "updated_at" = now()${whereClause} returning *`
      const updated = await sql.unsafe(query, values)
      return updated
    }

    let query = `select * from "${this.tableName}"${whereClause}`
    if (this.limitValue) {
      values.push(this.limitValue)
      query += ` limit $${values.length}`
    }

    const rows = await sql.unsafe(query, values)

    if (this.orderBy.length > 0) {
      rows.sort((a, b) => {
        for (const sort of this.orderBy) {
          this.assertColumnAllowed(sort.column)
          const left = a[sort.column]
          const right = b[sort.column]
          if (left === right) continue
          if (left == null) return 1
          if (right == null) return -1
          const compare = String(left).localeCompare(String(right), undefined, {
            numeric: true,
            sensitivity: "base",
          })
          return sort.ascending ? compare : -compare
        }
        return 0
      })
    }

    return rows
  }

  private async insertRows(rows: Record<string, unknown>[]) {
    if (rows.length === 0) return []
    return sql`
      insert into ${sql(this.tableName)} ${sql(rows)}
      returning *
    `
  }
}

export async function createClient() {
  const user = await getSessionUser()

  return {
    auth: {
      getUser: async () => ({
        data: {
          user,
        },
      }),
    },
    from: (tableName: TableName) => new TableQuery(tableName),
  }
}
