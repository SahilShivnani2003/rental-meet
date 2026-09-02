import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Coordinates } from './geocoding';

export class LocationPermissionDeniedError extends Error {
    constructor() {
        super('Location permission was denied.');
        this.name = 'LocationPermissionDeniedError';
    }
}

export class LocationTimeoutError extends Error {
    constructor(message = 'Could not get your location in time. Please try again or enter it manually.') {
        super(message);
        this.name = 'LocationTimeoutError';
    }
}

// ── Permission request ────────────────────────────────────────────────────────
async function requestLocationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
            title: 'Location Permission',
            message: 'We need your location to auto-fill your business address.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
        },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
}

interface PositionOptions {
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
}

// Wraps a single Geolocation.getCurrentPosition call in a promise, with a
// HARD timeout on top of the library's own `timeout` option. On some Android
// OEM location stacks (GPS disabled, background restrictions, certain
// battery-saver modes) neither the success nor the error callback ever
// fires, so relying on the native `timeout` alone can hang indefinitely.
// This guarantees the promise always settles.
function getPositionOnce(options: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        let settled = false;

        const hardTimeout = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new LocationTimeoutError());
        }, options.timeout + 2000); // small grace period over the native timeout

        Geolocation.getCurrentPosition(
            position => {
                if (settled) return;
                settled = true;
                clearTimeout(hardTimeout);
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            error => {
                if (settled) return;
                settled = true;
                clearTimeout(hardTimeout);
                reject(error);
            },
            options,
        );
    });
}

// ── Current position ───────────────────────────────────────────────────────────
// Two-stage strategy, fastest-viable-fix-first:
//
//  1. FAST PASS — low accuracy, short timeout, accept a fix up to 60s old.
//     This resolves almost instantly on most devices because it doesn't
//     wait for a fresh GPS lock (it can use cell/wifi positioning or a
//     cached fix), which is what was causing most of the timeouts.
//
//  2. ACCURATE PASS — only runs if the fast pass fails/times out. Requests
//     a fresh high-accuracy GPS fix with a longer timeout, since the device
//     may genuinely need to acquire one (first request, indoors → outdoors).
//
//  3. If both fail, throw a clear, user-facing LocationTimeoutError instead
//     of leaving the caller waiting.
export async function getCurrentCoordinates(): Promise<Coordinates> {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) throw new LocationPermissionDeniedError();

    try {
        return await getPositionOnce({
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000,
        });
    } catch (fastPassError) {
        try {
            return await getPositionOnce({
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });
        } catch (accuratePassError) {
            if (accuratePassError instanceof LocationTimeoutError) throw accuratePassError;
            throw new LocationTimeoutError();
        }
    }
}