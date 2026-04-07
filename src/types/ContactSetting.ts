export interface ContactSettings {
  address: string;
  phone: string;
  email: string;

  availability: string;

  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
  };

  filterSettings: {
    capacityMin: number;
    capacityMax: number;
    priceMin: number;
    priceMax: number;
  };

  createdAt: string;
  updatedAt: string;
}