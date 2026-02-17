export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum OrderStatus {
  PENDING = 'PENDENTE',
  DELIVERED = 'ENTREGUE',
  REJECTED = 'RECUSADO'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isMemberOfMonth?: boolean;
  clockifyId: string;
  balance: number;
  avatar: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  price: number;
  status: OrderStatus;
  date: string;
  timestamp: number;
}

export interface SiteSettings {
  loginLogo: string;
  storeLogo: string;
}

export interface ClockifyData {
  user: string;
  duration: string;
  tokens: number;
}