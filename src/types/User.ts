export type UserRole = 'owner' | 'admin' | 'subadmin' | 'customer' | 'employee';

export interface Permissions {
  dashboard: boolean;
  heroSlides: boolean;
  venues: boolean;
  venueTypes: boolean;
  users: boolean;
  employees: boolean;
  subadmins: boolean;
  bookings: boolean;
  payments: boolean;
  reports: boolean;
  reviews: boolean;
  platformSettings: boolean;
  settings: boolean;
}

export interface Referral {
  user?: string;
  joinedAt: string;
}

export interface Qualification {
  tenth?: {
    board?: string;
    year?: number;
    percentage?: number;
    certificate?: string;
  };
  twelfth?: {
    board?: string;
    year?: number;
    percentage?: number;
    certificate?: string;
  };
  graduation?: {
    degree?: string;
    university?: string;
    year?: number;
    percentage?: number;
    certificate?: string;
  };
  postGraduation?: {
    degree?: string;
    university?: string;
    year?: number;
    percentage?: number;
    certificate?: string;
  };
}

export interface EmployeeDocuments {
  aadhaarNumber?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  panNumber?: string;
  panCard?: string;
  gstNumber?: string;
  companyName?: string;
}

export interface BankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface ContractDetails {
  paymentType?: 'perLead' | 'overall';
  amount?: number;
}

export interface EmployeeDetails {
  title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  fatherOrHusbandName?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

  qualification?: Qualification;

  photo?: string;
  position?: string;
  department?: string;

  employmentType: 'Permanent' | 'Contract';

  salary?: number;

  contractDetails?: ContractDetails;

  joiningDate?: string;
  reportingManager?: string;

  previousExperience: number;

  documents?: EmployeeDocuments;

  bankDetails?: BankDetails;

  emergencyContact?: EmergencyContact;
}

export interface User {
  userId?: string;

  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;

  role: UserRole;

  password: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  profilePicture?: string;

  isActive: boolean;

  permissions: Permissions;

  referralCode?: string;
  referredBy?: string;
  referredByCode?: string;

  referralCount: number;
  referrals?: Referral[];

  gstNumber?: string;
  companyName?: string;
  panNumber?: string;

  employeeDetails?: EmployeeDetails;

  createdAt: string;
  updatedAt: string;
}