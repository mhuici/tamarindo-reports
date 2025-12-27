interface Client {
  id: string
  name: string
  email?: string
}

interface Report {
  id: string
  name: string
  type: 'MONTHLY' | 'WEEKLY' | 'CAMPAIGN' | 'CUSTOM'
  status: 'DRAFT' | 'GENERATING' | 'COMPLETED' | 'SCHEDULED' | 'FAILED'
  widgets: any[]
  dateRange: { start: string; end: string }
  aiInsights?: string
  pdfUrl?: string
  error?: string
  scheduledAt?: string
  scheduleCron?: string
  createdAt: string
  updatedAt?: string
  client: Client
  template?: { id: string; name: string }
}

interface CreateReportData {
  name: string
  clientId: string
  type?: Report['type']
  templateId?: string
  dateRange: { start: string; end: string }
  widgets?: any[]
}

interface UpdateReportData {
  name?: string
  status?: Report['status']
  widgets?: any[]
  dateRange?: { start: string; end: string }
  aiInsights?: string
  scheduledAt?: string | null
  scheduleCron?: string | null
}

export function useReports() {
  const reports = useState<Report[]>('reports', () => [])
  const currentReport = useState<Report | null>('current-report', () => null)
  const isLoading = useState<boolean>('reports-loading', () => false)

  /**
   * Fetch all reports
   */
  async function fetchReports(filters?: { clientId?: string; status?: string; type?: string }): Promise<Report[]> {
    isLoading.value = true

    try {
      const params = new URLSearchParams()
      if (filters?.clientId) params.set('clientId', filters.clientId)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.type) params.set('type', filters.type)

      const url = `/api/reports${params.toString() ? `?${params.toString()}` : ''}`
      const response = await $fetch<{ reports: Report[] }>(url)
      reports.value = response.reports
      return reports.value
    }
    catch (e) {
      console.error('Failed to fetch reports:', e)
      return []
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single report
   */
  async function fetchReport(id: string): Promise<Report | null> {
    isLoading.value = true

    try {
      const response = await $fetch<{ report: Report }>(`/api/reports/${id}`)
      currentReport.value = response.report
      return currentReport.value
    }
    catch (e) {
      console.error('Failed to fetch report:', e)
      return null
    }
    finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new report
   */
  async function createReport(data: CreateReportData): Promise<{ success: boolean; report?: Report; error?: string }> {
    try {
      const response = await $fetch<{ success: boolean; report: Report }>('/api/reports', {
        method: 'POST',
        body: data,
      })

      if (response.success && response.report) {
        reports.value = [response.report, ...reports.value]
      }

      return { success: true, report: response.report }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to create report' }
    }
  }

  /**
   * Update a report
   */
  async function updateReport(id: string, data: UpdateReportData): Promise<{ success: boolean; report?: Report; error?: string }> {
    try {
      const response = await $fetch<{ success: boolean; report: Report }>(`/api/reports/${id}`, {
        method: 'PUT',
        body: data,
      })

      if (response.success && response.report) {
        const index = reports.value.findIndex(r => r.id === id)
        if (index !== -1) {
          reports.value[index] = { ...reports.value[index], ...response.report }
        }
        if (currentReport.value?.id === id) {
          currentReport.value = { ...currentReport.value, ...response.report }
        }
      }

      return { success: true, report: response.report }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to update report' }
    }
  }

  /**
   * Delete a report
   */
  async function deleteReport(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await $fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      })

      reports.value = reports.value.filter(r => r.id !== id)
      if (currentReport.value?.id === id) {
        currentReport.value = null
      }

      return { success: true }
    }
    catch (e: any) {
      return { success: false, error: e?.data?.message || 'Failed to delete report' }
    }
  }

  return {
    reports: readonly(reports),
    currentReport: readonly(currentReport),
    isLoading: readonly(isLoading),
    fetchReports,
    fetchReport,
    createReport,
    updateReport,
    deleteReport,
  }
}
