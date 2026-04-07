export interface Review {
  name: string;
  role: string;

  profileImage: string | null;

  rating: number;

  description: string;

  isActive: boolean;
  order: number;

  createdAt: string;
  updatedAt: string;
}