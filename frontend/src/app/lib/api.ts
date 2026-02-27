// API Client for EcoTrade Backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<ApiResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    country: string;
  }) {
    return this.request<ApiResponse>('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request<ApiResponse>('/users/profile');
  }

  async loginWithSupabase(accessToken: string) {
    return this.request<ApiResponse>('/users/oauth/supabase', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  }

  async updateProfile(updates: any) {
    return this.request<ApiResponse>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async completeOnboarding(payload: {
    accountType: 'individual' | 'company';
    location?: any;
    preferences?: any;
  }) {
    return this.request<ApiResponse>('/users/onboarding', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async getStats() {
    return this.request<ApiResponse>('/users/stats');
  }

  // Products endpoints
  async searchProducts(params?: {
    search?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<ApiResponse>(
      `/products/search${queryString ? `?${queryString}` : ''}`
    );
  }

  async getProduct(id: string) {
    return this.request<ApiResponse>(`/products/${id}`);
  }

  async createProduct(productData: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    location?: string;
  }) {
    return this.request<ApiResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, updates: any) {
    return this.request<ApiResponse>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    return this.request<ApiResponse>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyProducts() {
    return this.request<ApiResponse>('/products/user/my-products');
  }

  async showInterest(productId: string) {
    return this.request<ApiResponse>(`/products/${productId}/interest`, {
      method: 'POST',
    });
  }

  // Transactions endpoints
  async getTransactions() {
    return this.request<ApiResponse>('/transactions');
  }

  async createTransaction(transactionData: {
    product: string;
    buyer: string;
    seller: string;
    amount: number;
  }) {
    return this.request<ApiResponse>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  // Recycling endpoints
  async getRecyclingPoints(params?: {
    city?: string;
    state?: string;
    status?: string;
    materialType?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request<ApiResponse>(
      `/recycling/points${queryString ? `?${queryString}` : ''}`
    );
  }

  async getNearbyRecyclingPoints(lat: number, lng: number, radius?: number) {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    if (radius) {
      queryParams.append('radius', radius.toString());
    }
    return this.request<ApiResponse>(`/recycling/points/nearby?${queryParams}`);
  }

  async getRecyclingPoint(id: string) {
    return this.request<ApiResponse>(`/recycling/points/${id}`);
  }

  async getRecyclingPointMaterials(id: string) {
    return this.request<ApiResponse>(`/recycling/points/${id}/materials`);
  }

  async getRecyclingPointStats(id: string) {
    return this.request<ApiResponse>(`/recycling/points/${id}/stats`);
  }

  async createRecyclingSubmission(submissionData: {
    recyclingPointId: string;
    materials: Array<{
      materialType: string;
      estimatedWeight: number;
      description?: string;
      condition: 'Excelente' | 'Bueno' | 'Regular' | 'Necesita Limpieza';
    }>;
    transportMethod?:
      | 'Entrega Personal'
      | 'Transporte Público'
      | 'Vehículo Propio'
      | 'Bicicleta'
      | 'Caminando';
    scheduledDate?: Date | string;
    preferredTimeSlot?:
      | '08:00-10:00'
      | '10:00-12:00'
      | '12:00-14:00'
      | '14:00-16:00'
      | '16:00-18:00';
    submissionNotes?: string;
  }) {
    return this.request<ApiResponse>('/recycling/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getUserSubmissions(status?: string) {
    const queryParams = status ? `?status=${status}` : '';
    return this.request<ApiResponse>(`/recycling/submissions/my-submissions${queryParams}`);
  }

  async getUserRecyclingStats() {
    return this.request<ApiResponse>('/recycling/submissions/stats');
  }

  async cancelSubmission(submissionId: string) {
    return this.request<ApiResponse>(`/recycling/submissions/${submissionId}/cancel`, {
      method: 'PATCH',
    });
  }

  // Recycling staff/admin endpoints
  async registerDeliveryByOperator(
    pointId: string,
    payload: {
      userRecyclingCode: string;
      materials: Array<{
        materialType: string;
        estimatedWeight: number;
        condition: 'Excelente' | 'Bueno' | 'Regular' | 'Necesita Limpieza';
        description?: string;
      }>;
      transportMethod?:
        | 'Entrega Personal'
        | 'Transporte Público'
        | 'Vehículo Propio'
        | 'Bicicleta'
        | 'Caminando';
      submissionNotes?: string;
      scheduledDate?: Date | string;
      preferredTimeSlot?:
        | '08:00-10:00'
        | '10:00-12:00'
        | '12:00-14:00'
        | '14:00-16:00'
        | '16:00-18:00';
    }
  ) {
    return this.request<ApiResponse>(`/recycling/points/${pointId}/submissions/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPointDashboard(pointId: string) {
    return this.request<ApiResponse>(`/recycling/points/${pointId}/dashboard`);
  }

  async getPointDeliveryStats(pointId: string) {
    return this.request<ApiResponse>(`/recycling/points/${pointId}/deliveries/stats`);
  }

  async listPointOperators(pointId: string) {
    return this.request<ApiResponse>(`/recycling/points/${pointId}/operators`);
  }

  async createPointOperator(
    pointId: string,
    payload: { username: string; email: string; password: string }
  ) {
    return this.request<ApiResponse>(`/recycling/points/${pointId}/operators`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async removePointOperator(pointId: string, operatorUserId: string) {
    return this.request<ApiResponse>(
      `/recycling/points/${pointId}/operators/${operatorUserId}`,
      { method: 'DELETE' }
    );
  }

  async getPendingSubmissions(params: {
    recyclingPointId: string;
    status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'partially_approved';
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.set('recyclingPointId', params.recyclingPointId);
    if (params.status) queryParams.set('status', params.status);
    if (params.limit) queryParams.set('limit', params.limit.toString());
    return this.request<ApiResponse>(`/recycling/submissions/pending?${queryParams.toString()}`);
  }

  async verifySubmission(
    submissionId: string,
    payload: {
      verificationStatus: 'approved' | 'rejected' | 'partially_approved' | 'in_review' | 'pending';
      actualWeights?: number[];
      verificationNotes?: string;
      rejectionReasons?: string[];
      qualityAssessment?: any;
      photos?: any[];
    }
  ) {
    return this.request<ApiResponse>(`/recycling/submissions/${submissionId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getSubmissionByCode(code: string) {
    return this.request<ApiResponse>(`/recycling/submissions/code/${code}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
