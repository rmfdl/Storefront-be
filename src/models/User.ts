export interface User {
  _id?: string;
  email: string;
  password: string;  
  role: 'admin';  // Hanya admin
}