import { parseApiErrorMessage } from "@/lib/http/parse-api-error-message"

type QueryFilter = { column: string; value: unknown }

class ClientTableQuery {
  private filters: QueryFilter[] = []
  private pendingUpdate: Record<string, unknown> | null = null

  constructor(private readonly tableName: "clients") {}

  select() {
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  single() {
    return this.execute(true)
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null } | { data: null | unknown[]; error: { message: string } }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute(false).then(onfulfilled ?? undefined, onrejected ?? undefined)
  }

  update(payload: Record<string, unknown>) {
    this.pendingUpdate = payload
    return this
  }

  private async execute(single: boolean) {
    const response = await fetch("/api/db/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: this.tableName,
        filters: this.filters,
        update: this.pendingUpdate,
        single,
      }),
    })

    const json = (await response.json()) as unknown
    if (!response.ok) {
      return {
        data: single ? null : [],
        error: { message: parseApiErrorMessage(json) || "Query failed" },
      }
    }
    return { data: (json as { data: unknown }).data, error: null }
  }
}

export function createClient() {
  return {
    auth: {
      getUser: async () => {
        const response = await fetch("/api/auth/me")
        const json = await response.json()
        return { data: { user: json.user ?? null } }
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const json = (await response.json()) as unknown
        return response.ok
          ? { error: null }
          : { error: { message: parseApiErrorMessage(json) ?? "Request failed" } }
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string
        password: string
        options?: { data?: { company_name?: string; contact_name?: string } }
      }) => {
        const response = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            companyName: options?.data?.company_name,
            contactName: options?.data?.contact_name,
          }),
        })
        const json = (await response.json()) as unknown
        return response.ok
          ? { error: null }
          : { error: { message: parseApiErrorMessage(json) ?? "Request failed" } }
      },
      signOut: async () => {
        await fetch("/api/auth/logout", { method: "POST" })
      },
      signInWithOAuth: async ({ provider }: { provider: "google" }) => {
        if (typeof window !== "undefined" && provider === "google") {
          window.location.href = "/api/auth/google/start?next=/portal"
          return { error: null }
        }
        return { error: { message: "Unsupported OAuth provider" } }
      },
    },
    from: (tableName: "clients") => new ClientTableQuery(tableName),
  }
}
