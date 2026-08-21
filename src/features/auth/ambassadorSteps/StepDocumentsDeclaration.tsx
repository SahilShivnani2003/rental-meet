import { View, Text, StyleSheet } from 'react-native';
import DocumentUploadCard from '../components/DocumentUploadCard';
import Checkbox from '../components/Checkbox';
import { Colors, Radii, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import { FieldErrors } from '@/utils/validation';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';

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

export default function StepDocumentsDeclaration({
    data,
    onChange,
    errors,
}: StepDocumentsDeclarationProps) {
    const { documents, declaration } = data;

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

    return (
        <View>
            <Text style={styles.heading}>Part I & J: Document Upload & Declaration</Text>

            <View style={styles.docRow}>
                <DocumentUploadCard
                    title="Aadhaar Card (Front Side)"
                    required
                    uri={documents.aadhaarFront}
                    onChange={t => setDocument('aadhaarFront', t)}
                    error={errors.aadhaarFront}
                />
                <DocumentUploadCard
                    title="Aadhaar Card (Back Side)"
                    uri={documents.aadhaarBack}
                    onChange={t => setDocument('aadhaarBack', t)}
                />
            </View>

            <View style={styles.docRow}>
                <DocumentUploadCard
                    title="PAN Card"
                    optionalLabel
                    uri={documents.panCard}
                    onChange={t => setDocument('panCard', t)}
                />
                <DocumentUploadCard
                    title="Passport Size Photo"
                    uri={documents.passportPhoto}
                    onChange={t => setDocument('passportPhoto', t)}
                />
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
                        value={declaration.applicantSignatureName}
                        onChangeText={t => setDeclaration('applicantSignatureName', t)}
                        autoCapitalize="words"
                        error={errors.applicantSignatureName}
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="Place"
                        placeholder="City / Town"
                        icon="location-outline"
                        value={declaration.place}
                        onChangeText={t => setDeclaration('place', t)}
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
    docRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
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
    agreeRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.primaryBorder },
    pairRow: { flexDirection: 'row', gap: Spacing.md },
    pairItem: { flex: 1 },
});
