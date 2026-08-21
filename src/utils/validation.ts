import { AmbassadorRegistration } from '@/types/ambassador.types';

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const AADHAAR_RE = /^\d{12}$/;
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const PINCODE_RE = /^\d{6}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function validatePersonalInfo(data: AmbassadorRegistration, confirmPassword: string): FieldErrors {
    const { personalInfo } = data;
    const errors: FieldErrors = {};

    if (!personalInfo.fullName.trim()) errors.fullName = 'Full name is required';
    if (!personalInfo.dateOfBirth.trim()) {
        errors.dateOfBirth = 'Date of birth is required';
    } else if (!/^\d{2}-\d{2}-\d{4}$/.test(personalInfo.dateOfBirth)) {
        errors.dateOfBirth = 'Use dd-mm-yyyy format';
    }
    if (!personalInfo.gender.trim()) errors.gender = 'Gender is required';

    if (!personalInfo.email.trim()) {
        errors.email = 'Email is required';
    } else if (!EMAIL_RE.test(personalInfo.email)) {
        errors.email = 'Enter a valid email address';
    }

    if (!personalInfo.whatsAppNumber.trim()) {
        errors.whatsAppNumber = 'Phone number is required';
    } else if (!PHONE_RE.test(personalInfo.whatsAppNumber)) {
        errors.whatsAppNumber = 'Enter a valid 10-digit mobile number';
    }

    if (!personalInfo.aadhaarNumber.trim()) {
        errors.aadhaarNumber = 'Aadhaar number is required';
    } else if (!AADHAAR_RE.test(personalInfo.aadhaarNumber)) {
        errors.aadhaarNumber = 'Enter a valid 12-digit Aadhaar number';
    }

    if (personalInfo.panNumber.trim() && !PAN_RE.test(personalInfo.panNumber.trim().toUpperCase())) {
        errors.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F)';
    }

    if (!data.password.trim()) {
        errors.password = 'Password is required';
    } else if (data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword.trim()) {
        errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== data.password) {
        errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
}

export function validateAddressDetails(data: AmbassadorRegistration): FieldErrors {
    const { addressDetails } = data;
    const errors: FieldErrors = {};

    if (!addressDetails.currentAddress.trim()) errors.currentAddress = 'Current address is required';
    if (!addressDetails.state.trim()) errors.state = 'State is required';
    if (!addressDetails.district.trim()) errors.district = 'District is required';
    if (!addressDetails.city.trim()) errors.city = 'City is required';

    if (!addressDetails.pincode.trim()) {
        errors.pincode = 'Pincode is required';
    } else if (!PINCODE_RE.test(addressDetails.pincode)) {
        errors.pincode = 'Enter a valid 6-digit pincode';
    }

    return errors;
}

export function validateProfessionalBackground(_data: AmbassadorRegistration): FieldErrors {
    // No field in Part C&D carries an asterisk in the source screenshot, and
    // "I want to join RentalMeet as" always has a selected default value, so
    // there is nothing that can block progression here.
    return {};
}

export function validateVenueNetwork(data: AmbassadorRegistration): FieldErrors {
    const errors: FieldErrors = {};
    const hasAnyVenueType = Object.values(data.venueNetwork).some(Boolean);
    if (!hasAnyVenueType) {
        errors.venueNetwork = 'Select at least one venue type';
    }
    if (!data.expectedPerformance.venuesPerDay.trim()) {
        errors.venuesPerDay = 'Select expected venues per day';
    }
    if (!data.expectedPerformance.venuesPerMonth.trim()) {
        errors.venuesPerMonth = 'Select expected venues per month';
    }
    return errors;
}

export function validateBankDetails(data: AmbassadorRegistration): FieldErrors {
    const { bankDetails } = data;
    const errors: FieldErrors = {};

    const hasUpi = !!bankDetails.upiId.trim();
    const hasFullBankDetails =
        !!bankDetails.accountHolderName.trim() &&
        !!bankDetails.bankName.trim() &&
        !!bankDetails.accountNumber.trim() &&
        !!bankDetails.ifscCode.trim();

    if (!hasUpi && !hasFullBankDetails) {
        errors.upiId = 'Provide a UPI ID or complete bank account details';
    }

    if (bankDetails.ifscCode.trim() && !IFSC_RE.test(bankDetails.ifscCode.trim().toUpperCase())) {
        errors.ifscCode = 'Enter a valid IFSC code';
    }

    if (bankDetails.accountNumber.trim() && !/^\d{9,18}$/.test(bankDetails.accountNumber.trim())) {
        errors.accountNumber = 'Enter a valid account number';
    }

    return errors;
}

export function validateDocumentsAndDeclaration(data: AmbassadorRegistration): FieldErrors {
    const errors: FieldErrors = {};

    if (!data.documents.aadhaarFront.trim()) errors.aadhaarFront = 'Aadhaar front side is required';

    if (!data.declaration.agreed) errors.agreed = 'You must accept the declaration to continue';
    if (!data.declaration.applicantSignatureName.trim()) {
        errors.applicantSignatureName = 'Signature / full name is required';
    }
    if (!data.declaration.place.trim()) errors.place = 'Place is required';

    return errors;
}
