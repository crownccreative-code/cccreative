const API_URL = process.env.REACT_APP_BACKEND_URL || '';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('ccc_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(data) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async forgotPassword(email) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  // Services
  async getServices() {
    return this.request('/api/services');
  }

  async getService(id) {
    return this.request(`/api/services/${id}`);
  }

  async createService(data) {
    return this.request('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id, data) {
    return this.request(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id) {
    return this.request(`/api/services/${id}`, { method: 'DELETE' });
  }

  // Packages
  async getPackages() {
    return this.request('/api/packages');
  }

  // Orders
  async createOrder(data = {}) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addOrderItem(orderId, data) {
    return this.request(`/api/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(id) {
    return this.request(`/api/orders/${id}`);
  }

  async getOrders(status = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/orders${params}`);
  }

  async updateOrder(id, data) {
    return this.request(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removeOrderItem(orderId, itemId) {
    return this.request(`/api/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
  }

  // Payments
  async createCheckoutSession(orderId) {
    return this.request('/api/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        origin_url: window.location.origin,
      }),
    });
  }

  async getCheckoutStatus(sessionId) {
    return this.request(`/api/payments/checkout-status/${sessionId}`);
  }

  async getPayments() {
    return this.request('/api/payments');
  }

  async refundPayment(paymentId) {
    return this.request(`/api/payments/${paymentId}/refund`, { method: 'POST' });
  }

  // Intake
  async createIntake(data) {
    return this.request('/api/intake', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIntake(id) {
    return this.request(`/api/intake/${id}`);
  }

  async getIntakes(type = null) {
    const params = type ? `?type=${type}` : '';
    return this.request(`/api/intake${params}`);
  }

  // Projects
  async getProjects(status = null) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/api/projects${params}`);
  }

  async getProject(id) {
    return this.request(`/api/projects/${id}`);
  }

  async updateProject(id, data) {
    return this.request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateProjectTimeline(id, timeline) {
    return this.request(`/api/projects/${id}/timeline`, {
      method: 'POST',
      body: JSON.stringify({ timeline }),
    });
  }

  // Threads/Messages
  async createThread(subject) {
    return this.request('/api/threads', {
      method: 'POST',
      body: JSON.stringify({ subject }),
    });
  }

  async getThreads() {
    return this.request('/api/threads');
  }

  async getThread(id) {
    return this.request(`/api/threads/${id}`);
  }

  async getMessages(threadId) {
    return this.request(`/api/threads/${threadId}/messages`);
  }

  async sendMessage(threadId, body, attachments = []) {
    return this.request(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, attachments }),
    });
  }

  // Files
  async getUploadSignature(resourceType = 'image', folder = 'uploads/') {
    return this.request(`/api/files/signature?resource_type=${resourceType}&folder=${folder}`);
  }

  async registerFileUpload(data) {
    return this.request('/api/files', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFiles(projectId = null, orderId = null) {
    const params = new URLSearchParams();
    if (projectId) params.append('project_id', projectId);
    if (orderId) params.append('order_id', orderId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/files${query}`);
  }

  async deleteFile(id) {
    return this.request(`/api/files/${id}`, { method: 'DELETE' });
  }

  // Portfolio
  async getPortfolio() {
    return this.request('/api/files/portfolio');
  }

  async addPortfolioItem(data) {
    return this.request('/api/files/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePortfolioItem(id) {
    return this.request(`/api/files/portfolio/${id}`, { method: 'DELETE' });
  }

  async reorderPortfolio(order) {
    return this.request('/api/files/portfolio/reorder', {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  }

  // Admin
  async getUsers(search = null, role = null) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/admin/users${query}`);
  }

  async updateUserRole(userId, role) {
    return this.request(`/api/admin/users/${userId}/role?role=${role}`, { method: 'PATCH' });
  }

  async deleteUser(userId) {
    return this.request(`/api/admin/users/${userId}`, { method: 'DELETE' });
  }

  async createClient(data) {
    return this.request('/api/admin/users/create-client', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStats() {
    return this.request('/api/admin/stats');
  }

  // ============ CCC Admin / Client Projects ============

  // Check if current user is CCC admin
  async checkCCCAdmin() {
    return this.request('/api/client-projects/check-admin');
  }

  // Get all clients (CCC Admin only)
  async getAllClients() {
    return this.request('/api/client-projects/admin/clients');
  }

  // Get a specific client's project (CCC Admin only)
  async getClientProject(userId) {
    return this.request(`/api/client-projects/admin/client/${userId}`);
  }

  // Update a client's project (CCC Admin only)
  async updateClientProject(userId, data) {
    return this.request(`/api/client-projects/admin/client/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Add a next step for a client (CCC Admin only)
  async addNextStep(userId, text) {
    return this.request(`/api/client-projects/admin/client/${userId}/next-step?text=${encodeURIComponent(text)}`, {
      method: 'POST',
    });
  }

  // Remove a next step (CCC Admin only)
  async removeNextStep(userId, stepId) {
    return this.request(`/api/client-projects/admin/client/${userId}/next-step/${stepId}`, {
      method: 'DELETE',
    });
  }

  // Get my project (Client)
  async getMyProject() {
    return this.request('/api/client-projects/my-project');
  }

  // Toggle next step completion (Client)
  async toggleNextStep(stepId, completed) {
    return this.request(`/api/client-projects/my-project/next-step/${stepId}?completed=${completed}`, {
      method: 'PATCH',
    });
  }

  // Upload file to project
  async uploadProjectFile(userId, data) {
    return this.request(`/api/client-projects/files/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get project files
  async getProjectFiles(userId) {
    return this.request(`/api/client-projects/files/${userId}`);
  }

  // Delete project file
  async deleteProjectFile(fileId) {
    return this.request(`/api/client-projects/files/${fileId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
export default api;
