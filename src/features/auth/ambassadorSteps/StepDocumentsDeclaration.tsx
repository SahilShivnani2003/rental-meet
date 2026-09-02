import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DocumentUploadCard from '../components/DocumentUploadCard';
import Checkbox from '../components/Checkbox';
import { Colors, Radii, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';
import { FieldErrors } from '../validation/ambassadorValidation';
import { useAlert } from '@/context/AlertContext';
import { ApiError } from '@/types/ApiError';
import { useUploadImage } from '@/features/profile/hooks/useUploadImage';
import { useUploadDocument } from '@/features/venue/hooks/useUpload';

interface StepDocumentsDeclarationProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    errors: FieldErrors;
}

const DECLARATION_POINTS = [
    'The information provided by me is true and correct.',
    'I agree to follow RentalMeet™ venue verification guidelines.',
    'I will not upload fake, duplicate, or misleading venue information.',
    'I understand payments will be made only for verified & approved venue listings.',
    'I agree to RentalMeet™ Ambassador Program terms & conditions.',
];

type DocumentField = keyof AmbassadorRegistration['documents'];

// DocumentUploadCard only hands us a local file uri, so we build the
// {uri, name, type} object the upload service expects from it here.
const buildFileFromUri = (uri: string) => {
    const name = uri.split('/').pop() || `upload-${Date.now()}.jpg`;
    const extMatch = /\.(\w+)$/.exec(name);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const type = ext === 'png' ? 'image/png' : ext === 'pdf' ? 'application/pdf' : 'image/jpeg';
    return { uri, name, type };
};

export default function StepDocumentsDeclaration({
    data,
    onChange,
    errors,
}: StepDocumentsDeclarationProps) {
    const { documents, declaration, name, addressDetails } = data;
    const alert = useAlert();

    const { mutate: uploadDocument } = useUploadDocument();
    const { mutate: uploadImage } = useUploadImage();

    useEffect(() => {
        if (name) {
            setDeclaration('applicantSignatureName', name);
        }
        if (addressDetails.city) {
            setDeclaration('place', addressDetails.city);
        }
    }, [name, addressDetails.city]);
    // The card has no "loading" prop and only ever reports a local uri, so we
    // show that local uri as an optimistic preview while the upload is in
    // flight, then swap it out for the server URL (or revert) once it settles.
    const [localPreviews, setLocalPreviews] = useState<Partial<Record<DocumentField, string>>>({});
    const [uploadingFields, setUploadingFields] = useState<Partial<Record<DocumentField, boolean>>>(
        {},
    );
    const [uploadErrors, setUploadErrors] = useState<Partial<Record<DocumentField, string>>>({});

    const setDocument = <K extends keyof AmbassadorRegistration['documents']>(
        key: K,
        value: AmbassadorRegistration['documents'][K],
    ) => {
        onChange(prev => ({ ...prev, documents: { ...prev.documents, [key]: value } }));
    };

    const setDeclaration = <K extends keyof AmbassadorRegistration['declaration']>(
        key: K,
        value: AmbassadorRegistration['declaration'][K],
    ) => {
        onChange(prev => ({ ...prev, declaration: { ...prev.declaration, [key]: value } }));
    };

    const handleDocumentPick = (
        field: DocumentField,
        localUri: string,
        kind: 'document' | 'image' = 'document',
    ) => {
        setUploadErrors(prev => ({ ...prev, [field]: undefined }));
        setLocalPreviews(prev => ({ ...prev, [field]: localUri }));
        setUploadingFields(prev => ({ ...prev, [field]: true }));

        const onDone = () => setUploadingFields(prev => ({ ...prev, [field]: false }));

        const onSuccess = (result: any) => {
            const url = result?.url ?? result?.data?.url;
            if (!url) {
                setUploadErrors(prev => ({
                    ...prev,
                    [field]: 'Upload succeeded but no URL was returned',
                }));
                alert.error('Upload failed', 'Upload succeeded but no URL was returned');
                setLocalPreviews(prev => ({ ...prev, [field]: undefined }));
                onDone();
                return;
            }
            setDocument(field, url);
            setLocalPreviews(prev => ({ ...prev, [field]: url }));
            onDone();
        };

        const onError = (error: ApiError) => {
            const message = error?.message || 'Failed to upload file. Please try again.';
            setUploadErrors(prev => ({ ...prev, [field]: message }));
            alert.error('Upload failed', message);
            setLocalPreviews(prev => ({ ...prev, [field]: undefined }));
            onDone();
        };

        if (kind === 'image') {
            // useUploadImage (profile feature) expects a real FormData instance.
            const formData = new FormData();
            const file = buildFileFromUri(localUri);
            formData.append('file', file as any);
            formData.append('folder', 'ambassador-documents');

            uploadImage(formData, { onSuccess, onError });
        } else {
            // useUploadDocument (venue feature) expects { file, folder }.
            uploadDocument(
                { file: buildFileFromUri(localUri), folder: 'ambassador-documents' },
                { onSuccess, onError },
            );
        }
    };

    const displayUri = (field: DocumentField) => localPreviews[field] ?? documents[field];

    return (
        <View>
            <Text style={styles.heading}>Part I & J: Document Upload & Declaration</Text>

            <View style={styles.docRow}>
                <View style={styles.docCell}>
                    <DocumentUploadCard
                        title="Aadhaar Card (Front Side)"
                        required
                        uri={displayUri('aadhaarFront')}
                        onChange={uri => handleDocumentPick('aadhaarFront', uri, 'image')}
                        error={errors.aadhaarFront || uploadErrors.aadhaarFront}
                    />
                    {uploadingFields.aadhaarFront && (
                        <Text style={styles.uploadingText}>Uploading…</Text>
                    )}
                </View>
                <View style={styles.docCell}>
                    <DocumentUploadCard
                        title="Aadhaar Card (Back Side)"
                        required
                        uri={displayUri('aadhaarBack')}
                        onChange={uri => handleDocumentPick('aadhaarBack', uri, 'image')}
                        error={uploadErrors.aadhaarBack}
                    />
                    {uploadingFields.aadhaarBack && (
                        <Text style={styles.uploadingText}>Uploading…</Text>
                    )}
                </View>
            </View>

            <View style={styles.docRow}>
                <View style={styles.docCell}>
                    <DocumentUploadCard
                        title="PAN Card"
                        optionalLabel
                        uri={displayUri('panCard')}
                        onChange={uri => handleDocumentPick('panCard', uri, 'image')}
                        error={uploadErrors.panCard}
                    />
                    {uploadingFields.panCard && (
                        <Text style={styles.uploadingText}>Uploading…</Text>
                    )}
                </View>
                <View style={styles.docCell}>
                    <DocumentUploadCard
                        title="Passport Size Photo"
                        required
                        uri={displayUri('passportPhoto')}
                        onChange={uri => handleDocumentPick('passportPhoto', uri, 'image')}
                        error={uploadErrors.passportPhoto}
                    />
                    {uploadingFields.passportPhoto && (
                        <Text style={styles.uploadingText}>Uploading…</Text>
                    )}
                </View>
            </View>

            <View style={[styles.declarationBox, !!errors.agreed && styles.declarationBoxError]}>
                <Text style={styles.declarationTitle}>Applicant Declaration:</Text>
                {DECLARATION_POINTS.map(point => (
                    <View key={point} style={styles.bulletRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{point}</Text>
                    </View>
                ))}
                <View style={styles.agreeRow}>
                    <Checkbox
                        checked={declaration.agreed}
                        onToggle={() => setDeclaration('agreed', !declaration.agreed)}
                        label="I agree and accept all the terms above."
                        error={!!errors.agreed}
                    />
                </View>
            </View>

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Applicant Signature / Full Name"
                        placeholder="Enter your full name"
                        icon="create-outline"
                        value={name || declaration.applicantSignatureName}
                        onChangeText={t => setDeclaration('applicantSignatureName', t )}
                        autoCapitalize="words"
                        error={errors.applicantSignatureName}
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="Place"
                        placeholder="City / Town"
                        icon="location-outline"
                        value={addressDetails.city || declaration.place}
                        onChangeText={t => setDeclaration('place', t )}
                        autoCapitalize="words"
                        error={errors.place}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 15,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.lg,
    },
    docRow: { flexDirection: 'column', gap: Spacing.md, marginBottom: Spacing.md },
    docCell: { flex: 1, minWidth: '46%' },
    uploadingText: {
        fontSize: 10.5,
        fontWeight: Typography.semiBold,
        color: Colors.primaryDark,
        textAlign: 'center',
        marginTop: 4,
    },
    declarationBox: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primaryBorder,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    declarationBoxError: { borderColor: Colors.danger },
    declarationTitle: {
        fontSize: 13.5,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
    },
    bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 5, paddingRight: Spacing.xs },
    bullet: { fontSize: 13, color: Colors.primaryDark, lineHeight: 19 },
    bulletText: { flex: 1, fontSize: 12.5, color: Colors.charcoalMid, lineHeight: 19 },
    agreeRow: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.primaryBorder,
    },
    pairRow: { flexDirection: 'column', gap: Spacing.md },
    pairItem: { flex: 1 },
});
function useeffect(arg0: () => void, arg1: string[]) {
    throw new Error('Function not implemented.');
}

