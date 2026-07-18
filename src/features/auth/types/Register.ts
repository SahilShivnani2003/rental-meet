export interface RegisterClient {
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    password: string;
    role: 'customer'
    referralCode?: string;
    deviceId?: string;
}

export interface RegisterOwner {
    name: string;
    email: string;
    phone: string;
    password: string;
    city: string;
    state: string;
    role: 'owner';
    referralCode?: string;
    deviceId?: string;
}

export interface RegisterVendor {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'vendor';
    referralCode?: string;
    city: string;
    state: string;
    deviceId?: string;
}