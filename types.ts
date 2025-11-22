
export type UserRole = 'admin' | 'coach' | 'super-admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubName?: string; // Only relevant for admins creating the club (and linking coaches)
  password?: string; // Added for mock auth
  recoveryCode?: string; // Code/PIN used to reset password without email server
  mustChangePassword?: boolean; // Forces user to change password on next login
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  category: string;
  description: string;
  imageUrl?: string;
}

export interface ReservationItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface DamageReport {
  itemId: string;
  itemName: string;
  quantityDamaged: number;
  description: string;
  reportedBy: string;
  date: string;
  isResolved?: boolean; // New field to track if admin handled it
}

export interface Reservation {
  id: string;
  items: ReservationItem[];
  coachId: string;
  coachName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'active' | 'completed' | 'cancelled';
  damageReports?: DamageReport[]; // Optional list of damages reported upon return
  returnedAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Initial Mock Data Types
export interface AppData {
  items: Item[];
  users: User[];
  reservations: Reservation[];
}