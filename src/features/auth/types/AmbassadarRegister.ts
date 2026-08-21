export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  whatsAppNumber: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
}

export interface AddressDetails {
  currentAddress: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  areaCoverage: string;
}

export interface ProfessionalDetails {
  currentOccupation: string;
  companyName: string;
  educationQualification: string;
  workExperience: string;
  salesMarketingExperience: boolean;
  digitalMarketingExperience: boolean;
}

export interface PreferredWorkingArea {
  cityCoverage: string;
  districtCoverage: string;
  stateCoverage: string;
}

export interface VenueNetwork {
  hotels: boolean;
  meetingRooms: boolean;
  conferenceHalls: boolean;
  trainingCentres: boolean;
  coachingInstitutes: boolean;
  banquetHalls: boolean;
  marriageGardens: boolean;
  farmHouses: boolean;
  coworkingSpaces: boolean;
  schoolsColleges: boolean;
}

export interface ExpectedPerformance {
  venuesPerDay: string;
  venuesPerMonth: string;
  preferredWorkingTime: string;
  preferredAreaCoverage: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}

export interface Documents {
  passportPhoto: string;
  aadhaarFront: string;
  aadhaarBack: string;
  panCard: string;
  identityProof: string;
  identityProofBack: string;
  identityProofType: string;
  bankProof: string;
  addressProof: string;
}

export interface Declaration {
  agreed: boolean;
  applicantSignatureName: string;
  place: string;
}

export interface AmbassadorRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;

  personalInfo: PersonalInfo;
  addressDetails: AddressDetails;
  professionalDetails: ProfessionalDetails;

  profileType: string;

  preferredWorkingArea: PreferredWorkingArea;
  venueNetwork: VenueNetwork;
  expectedPerformance: ExpectedPerformance;

  bankDetails: BankDetails;
  documents: Documents;
  declaration: Declaration;
}