
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
  productId: string;
  productName: string;
  price: number;
  status: OrderStatus;
  date: string;
  timestamp: number;
  viewed?: boolean; // Se o usuário já viu a notificação de mudança de status
  updatedAt?: number;
}

export interface ClockifyData {
  user: string;
  duration: string;
  tokens: number;
}

export interface AppBranding {
  loginLogo: string | null;
  storeLogo: string | null;
}
