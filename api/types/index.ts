export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}
