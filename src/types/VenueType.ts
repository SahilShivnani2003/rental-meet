export interface VenueType {
  name: string;
  code: string;

  description?: string;

  icon: string;

  isActive: boolean;
  order: number;

  createdAt: string;
  updatedAt: string;
}