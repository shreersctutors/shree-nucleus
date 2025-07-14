export interface CreateUserRequest {
  user_email: string
  user_role: number
  user_country: 'CANADA' | 'INDIA' | 'UK' | 'USA'
}

export interface CreateUserResponse {
  user_id: number
  user_email: string
  user_role: number
  user_country: 'CANADA' | 'INDIA' | 'UK' | 'USA'
  firebase_uid: string
}
