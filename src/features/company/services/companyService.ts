import apiClient from '@/services/apiClient'
import type {
  Company,
  CompanyCreationRequest,
  CompanyInvitation,
  CompanyMember,
  CompanyRole,
  WorkspaceAccessRequest,
} from '../types/company.types'

export const companyService = {
  /**
   * Fetches all companies where the current user holds membership.
   */
  async getMyCompanies(): Promise<Company[]> {
    const res = await apiClient.get<Company[]>('/companies/me')
    return res.data
  },

  /**
   * Gets details of a specific company by slug.
   */
  async getCompanyBySlug(slug: string): Promise<Company> {
    const res = await apiClient.get<Company>(`/companies/${slug}`)
    return res.data
  },

  /**
   * Updates company settings (owner/admin only).
   */
  async updateCompany(slug: string, payload: { name?: string; description?: string }): Promise<Company> {
    const res = await apiClient.patch<Company>(`/companies/${slug}`, payload)
    return res.data
  },

  /**
   * Lists all active members of a company.
   */
  async getCompanyMembers(slug: string): Promise<CompanyMember[]> {
    const res = await apiClient.get<CompanyMember[]>(`/companies/${slug}/members`)
    return res.data
  },

  /**
   * Adds an existing registered user to the company.
   */
  async addCompanyMember(slug: string, payload: { email: string; role: CompanyRole }): Promise<CompanyMember> {
    const res = await apiClient.post<CompanyMember>(`/companies/${slug}/members`, payload)
    return res.data
  },

  /**
   * Updates a member's role in the company.
   */
  async updateMemberRole(slug: string, userId: number, role: CompanyRole): Promise<CompanyMember> {
    const res = await apiClient.patch<CompanyMember>(`/companies/${slug}/members/${userId}`, { role })
    return res.data
  },

  /**
   * Removes a member from the company.
   */
  async removeMember(slug: string, userId: number): Promise<void> {
    await apiClient.delete(`/companies/${slug}/members/${userId}`)
  },

  /**
   * Lists pending invitations for a company.
   */
  async getCompanyInvitations(slug: string): Promise<CompanyInvitation[]> {
    const res = await apiClient.get<CompanyInvitation[]>(`/companies/${slug}/invitations`)
    return res.data
  },

  /**
   * Creates an invitation with a single-use token.
   */
  async inviteMember(slug: string, payload: { email: string; role: CompanyRole }): Promise<CompanyInvitation> {
    const res = await apiClient.post<CompanyInvitation>(`/companies/${slug}/invitations`, payload)
    return res.data
  },

  /**
   * Revokes a pending company invitation.
   */
  async revokeInvitation(slug: string, invitationId: number): Promise<void> {
    await apiClient.delete(`/companies/${slug}/invitations/${invitationId}`)
  },

  /**
   * Accepts an invitation token to join a company.
   */
  async acceptInvitation(token: string): Promise<CompanyMember> {
    const res = await apiClient.post<CompanyMember>('/companies/invitations/accept', { token })
    return res.data
  },

  /**
   * Submits a company creation request for platform superuser review.
   */
  async submitCreationRequest(payload: {
    company_name: string
    company_slug?: string
    business_description?: string
  }): Promise<CompanyCreationRequest> {
    const res = await apiClient.post<CompanyCreationRequest>('/companies/requests', payload)
    return res.data
  },

  /**
   * Lists creation requests submitted by the logged-in user.
   */
  async getMyCreationRequests(): Promise<CompanyCreationRequest[]> {
    const res = await apiClient.get<CompanyCreationRequest[]>('/companies/requests/mine')
    return res.data
  },

  /**
   * Lists workspace access requests for the specified company.
   */
  async getWorkspaceRequests(slug: string, status?: string): Promise<WorkspaceAccessRequest[]> {
    const params = status ? { status } : {}
    const res = await apiClient.get<WorkspaceAccessRequest[]>(`/companies/${slug}/workspace-requests`, { params })
    return res.data
  },

  /**
   * Submits a workspace access request.
   */
  async createWorkspaceRequest(
    slug: string,
    payload: {
      request_type: 'CREATE_WORKSPACE' | 'JOIN_WORKSPACE'
      workspace_id?: number
      requested_role?: string
      reason?: string
    }
  ): Promise<WorkspaceAccessRequest> {
    const res = await apiClient.post<WorkspaceAccessRequest>(`/companies/${slug}/workspace-requests`, payload)
    return res.data
  },

  /**
   * Approves a workspace access request.
   */
  async approveWorkspaceRequest(
    slug: string,
    requestId: number,
    payload?: { decision_reason?: string; approved_role?: string }
  ): Promise<WorkspaceAccessRequest> {
    const res = await apiClient.post<WorkspaceAccessRequest>(
      `/companies/${slug}/workspace-requests/${requestId}/approve`,
      payload || {}
    )
    return res.data
  },

  /**
   * Rejects a workspace access request.
   */
  async rejectWorkspaceRequest(
    slug: string,
    requestId: number,
    payload?: { decision_reason?: string }
  ): Promise<WorkspaceAccessRequest> {
    const res = await apiClient.post<WorkspaceAccessRequest>(
      `/companies/${slug}/workspace-requests/${requestId}/reject`,
      payload || {}
    )
    return res.data
  },

  /**
   * Cancels a pending workspace access request.
   */
  async cancelWorkspaceRequest(slug: string, requestId: number): Promise<WorkspaceAccessRequest> {
    const res = await apiClient.post<WorkspaceAccessRequest>(
      `/companies/${slug}/workspace-requests/${requestId}/cancel`
    )
    return res.data
  },
}
