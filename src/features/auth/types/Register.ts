export interface RegisterClient {
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    password: string;
    role: 'customer'
    referralCode?: string;
}

export interface RegisterOwner {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'owner';
    referralCode?: string;
}

export interface RegisterVendor {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'vendor';
    referralCode?: string;
    accountType: 'individual' | 'company';
    vendorCategory: string;
    city: string;
    state: string;
}