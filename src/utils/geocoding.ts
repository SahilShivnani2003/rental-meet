import { config } from "@/config/env";

const apiKey = config.GOOGLEAPI;

const FETCH_TIMEOUT_MS = 8000;

export type Coordinates = {
    latitude: number;
    longitude: number;
};

export type GeocodedAddress = {
    formattedAddress: string;
    addressLine: string; // street/premise level, best-effort
    city: string;
    state: string;
    pincode: string;
    country: string;
    coordinates: Coordinates;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const findComponent = (
    components: any[],
    type: string,
): string => components.find(c => c.types.includes(type))?.long_name ?? '';

const buildAddressLine = (components: any[]): string => {
    const streetNumber = findComponent(components, 'street_number');
    const route = findComponent(components, 'route');
    const sublocality =
        findComponent(components, 'sublocality_level_1') ||
        findComponent(components, 'sublocality');
    return [streetNumber, route, sublocality].filter(Boolean).join(', ');
};

const parseGeocodeResult = (result: any, coordinates: Coordinates): GeocodedAddress => {
    const components = result.address_components ?? [];
    return {
        formattedAddress: result.formatted_address ?? '',
        addressLine: buildAddressLine(components) || result.formatted_address?.split(',')[0] || '',
        city:
            findComponent(components, 'locality') ||
            findComponent(components, 'administrative_area_level_2'),
        state: findComponent(components, 'administrative_area_level_1'),
        pincode: findComponent(components, 'postal_code'),
        country: findComponent(components, 'country'),
        coordinates,
    };
};

// A stalled network request (bad connectivity, captive portal, etc.) can
// hang a plain fetch() indefinitely since there's no default timeout.
// AbortController gives us a hard cutoff so callers never wait forever.
async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// ── Coordinates → Address ─────────────────────────────────────────────────────
export async function coordinatesToAddress(
    coordinates: Coordinates,
): Promise<GeocodedAddress | null> {
    const { latitude, longitude } = coordinates;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    try {
        const res = await fetchWithTimeout(url);
        const data = await res.json();

        if (data.status !== 'OK' || !data.results?.length) {
            throw new Error(data.error_message || `Reverse geocoding failed: ${data.status}`);
        }

        // Prefer the most specific result (first one) but this is already
        // ordered most-to-least specific by the API.
        return parseGeocodeResult(data.results[0], coordinates);
    } catch (error) {
        console.error('Error reverse geocoding coordinates:', error);
        return null;
    }
}

// ── Address → Coordinates ─────────────────────────────────────────────────────
export async function addressToCoordinates(address: string): Promise<GeocodedAddress | null> {
    if (!address.trim()) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
    )}&key=${apiKey}`;

    try {
        const res = await fetchWithTimeout(url);
        const data = await res.json();

        if (data.status !== 'OK' || !data.results?.length) {
            throw new Error(data.error_message || `Forward geocoding failed: ${data.status}`);
        }

        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        return parseGeocodeResult(result, { latitude: lat, longitude: lng });
    } catch (error) {
        console.error('Error forward geocoding address:', error);
        return null;
    }
}