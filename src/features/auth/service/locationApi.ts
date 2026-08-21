import { DropdownOption } from '@/components/common/SearchableDropdown';

/**
 * Minimal location lookup service. Not provided anywhere in the existing project,
 * but required for SearchableDropdown (State / District / City) on the Address
 * step. Replace the in-memory dataset below with a real backend/geo API call
 * when one is available — the fetchOptions contract (query -> DropdownOption[])
 * stays the same either way.
 */

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

const DISTRICTS_BY_STATE: Record<string, string[]> = {
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Itarsi (Hoshangabad)', 'Jabalpur', 'Gwalior', 'Ujjain'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    Karnataka: ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Belagavi'],
    Delhi: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi'],
};

const CITIES_BY_DISTRICT: Record<string, string[]> = {
    Indore: ['Indore'],
    Bhopal: ['Bhopal'],
    'Itarsi (Hoshangabad)': ['Itarsi', 'Hoshangabad'],
    Jabalpur: ['Jabalpur'],
    Gwalior: ['Gwalior'],
    Ujjain: ['Ujjain'],
    Mumbai: ['Mumbai', 'Navi Mumbai', 'Thane'],
    Pune: ['Pune', 'Pimpri-Chinchwad'],
    Nagpur: ['Nagpur'],
    Nashik: ['Nashik'],
    Aurangabad: ['Aurangabad'],
    'Bengaluru Urban': ['Bengaluru'],
    Mysuru: ['Mysuru'],
    Mangaluru: ['Mangaluru'],
    Belagavi: ['Belagavi'],
    'New Delhi': ['New Delhi'],
    'North Delhi': ['North Delhi'],
    'South Delhi': ['South Delhi'],
    'East Delhi': ['East Delhi'],
};

function toOptions(values: string[], query: string): DropdownOption[] {
    const q = query.trim().toLowerCase();
    return values
        .filter(v => v.toLowerCase().includes(q))
        .map(v => ({ name: v, placeId: v }));
}

/** Simulated network latency so loading states are exercised in the UI. */
function delay<T>(value: T, ms = 250): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

export async function getStates(query: string): Promise<DropdownOption[]> {
    return delay(toOptions(INDIAN_STATES, query));
}

export async function getDistrictsByState(state: string, query: string): Promise<DropdownOption[]> {
    const districts = DISTRICTS_BY_STATE[state] ?? [];
    return delay(toOptions(districts, query));
}

export async function getCitiesByDistrict(district: string, query: string): Promise<DropdownOption[]> {
    const cities = CITIES_BY_DISTRICT[district] ?? [];
    return delay(toOptions(cities, query));
}
