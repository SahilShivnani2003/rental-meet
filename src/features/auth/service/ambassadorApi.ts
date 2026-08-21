import { AmbassadorRegistration } from '@/types/ambassador.types';

// Mirrors the base URL pattern used by the rest of the app's API layer.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.rentalmeet.com';

export interface AmbassadorSubmitResult {
    success: boolean;
    message: string;
}

const FILE_FIELDS: Array<keyof AmbassadorRegistration['documents']> = [
    'passportPhoto',
    'aadhaarFront',
    'aadhaarBack',
    'panCard',
    'identityProof',
    'identityProofBack',
    'bankProof',
    'addressProof',
];

function isLocalFileUri(uri: string): boolean {
    return !!uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://'));
}

function guessFileName(uri: string, fallback: string): string {
    const parts = uri.split('/');
    return parts[parts.length - 1] || fallback;
}

/**
 * Submits the completed Ambassador registration form. Documents are sent as
 * multipart file parts; everything else is sent as a single JSON payload
 * field, which is the pattern the rest of this form's data (personalInfo,
 * addressDetails, etc.) is structured around.
 */
export async function submitAmbassadorRegistration(
    data: AmbassadorRegistration,
): Promise<AmbassadorSubmitResult> {
    const formData = new FormData();

    const { documents, ...jsonPayload } = data;
    formData.append('payload', JSON.stringify(jsonPayload));

    FILE_FIELDS.forEach(field => {
        const uri = documents[field];
        if (isLocalFileUri(uri)) {
            // React Native's FormData accepts this shape for file uploads.
            formData.append(field, {
                uri,
                name: guessFileName(uri, `${field}.jpg`),
                type: 'image/jpeg',
            } as unknown as Blob);
        }
    });

    const response = await fetch(`${API_BASE_URL}/api/ambassador/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
    });

    if (!response.ok) {
        let message = 'Registration failed. Please try again.';
        try {
            const errorBody = await response.json();
            if (errorBody?.message) message = errorBody.message;
        } catch {
            // response wasn't JSON — keep the default message
        }
        throw new Error(message);
    }

    const body = await response.json().catch(() => ({}));
    return {
        success: true,
        message: body?.message ?? 'Registration submitted successfully.',
    };
}
