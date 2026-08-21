import { View, Text, StyleSheet } from 'react-native';
import SelectField from '../components/SelectField';
import Checkbox from '../components/Checkbox';
import { Colors, Spacing, Typography } from '@/theme/theme';
import Field from '@/components/UI/InputField';
import { PROFILE_TYPE_OPTIONS } from '@/utils/defaults';
import { FieldErrors } from '@/utils/validation';
import { AmbassadorRegistration } from '../types/AmbassadarRegister';

interface StepProfessionalBackgroundProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    errors: FieldErrors;
}

export default function StepProfessionalBackground({
    data,
    onChange,
    errors,
}: StepProfessionalBackgroundProps) {
    const { professionalDetails } = data;

    const setProfessional = <K extends keyof AmbassadorRegistration['professionalDetails']>(
        key: K,
        value: AmbassadorRegistration['professionalDetails'][K],
    ) => {
        onChange(prev => ({
            ...prev,
            professionalDetails: { ...prev.professionalDetails, [key]: value },
        }));
    };

    return (
        <View>
            <Text style={styles.heading}>Part C & D: Professional Background & Profile</Text>

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Current Occupation"
                        placeholder="e.g. Student, Freelancer, Sales Exec"
                        icon="briefcase-outline"
                        value={professionalDetails.currentOccupation}
                        onChangeText={t => setProfessional('currentOccupation', t)}
                        autoCapitalize="words"
                        error={errors.currentOccupation}
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="Company / Organization (If any)"
                        placeholder="Company Name"
                        icon="business-outline"
                        value={professionalDetails.companyName}
                        onChangeText={t => setProfessional('companyName', t)}
                        autoCapitalize="words"
                    />
                </View>
            </View>

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <Field
                        label="Education Qualification"
                        placeholder="e.g. Graduate, 12th, MBA"
                        icon="school-outline"
                        value={professionalDetails.educationQualification}
                        onChangeText={t => setProfessional('educationQualification', t)}
                        autoCapitalize="words"
                    />
                </View>
                <View style={styles.pairItem}>
                    <Field
                        label="Work Experience"
                        placeholder="e.g. 1 Year in Marketing / Fresher"
                        icon="time-outline"
                        value={professionalDetails.workExperience}
                        onChangeText={t => setProfessional('workExperience', t)}
                        autoCapitalize="sentences"
                    />
                </View>
            </View>

            <SelectField
                label="I want to join RentalMeet as:"
                value={data.profileType}
                options={PROFILE_TYPE_OPTIONS}
                onSelect={v => onChange(prev => ({ ...prev, profileType: v }))}
            />

            <View style={styles.checkboxGroup}>
                <Checkbox
                    checked={professionalDetails.salesMarketingExperience}
                    onToggle={() =>
                        setProfessional('salesMarketingExperience', !professionalDetails.salesMarketingExperience)
                    }
                    label="I have Sales / Marketing Experience"
                />
                <Checkbox
                    checked={professionalDetails.digitalMarketingExperience}
                    onToggle={() =>
                        setProfessional(
                            'digitalMarketingExperience',
                            !professionalDetails.digitalMarketingExperience,
                        )
                    }
                    label="I have Digital Marketing Experience"
                />
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
    pairRow: { flexDirection: 'row', gap: Spacing.md },
    pairItem: { flex: 1 },
    checkboxGroup: { gap: Spacing.md, marginTop: Spacing.xs },
});
