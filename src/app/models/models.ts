export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isApproved: boolean;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  type: string;
  pricePerNight: number;
  location: string;
  latitude: number;
  longitude: number;
  maxGuests: number;
  isAvailable: boolean;
  ownerName: string;
  averageRating: number;
  images: string[];
}

export interface Booking {
  id: number;
  propertyTitle: string;
  propertyType: string;
  propertyLocation: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  guestsCount: number;
  status: string;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  bookingId: number;
  propertyTitle: string;
  amount: number;
  method: string;
  status: string;
  transactionRef: string;
  paidAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

