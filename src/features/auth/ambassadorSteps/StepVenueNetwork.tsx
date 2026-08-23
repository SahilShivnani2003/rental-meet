import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SelectableCard from '../components/SelectableCard';
import SelectField from '../components/SelectField';
import { Colors, Spacing, Typography } from '@/theme/theme';
import { AmbassadorRegistration, VenueNetwork } from '../types/AmbassadarRegister';
import { FieldErrors } from '../validation/ambassadorValidation';
import { VENUES_PER_DAY_OPTIONS, VENUES_PER_MONTH_OPTIONS } from '../validation/createAmbassadorForm';

interface StepVenueNetworkProps {
    data: AmbassadorRegistration;
    onChange: (updater: (prev: AmbassadorRegistration) => AmbassadorRegistration) => void;
    errors: FieldErrors;
}

const VENUE_TYPE_LABELS: Array<{ key: keyof VenueNetwork; label: string }> = [
    { key: 'hotels', label: 'Hotels' },
    { key: 'meetingRooms', label: 'Meeting Rooms' },
    { key: 'conferenceHalls', label: 'Conference Halls' },
    { key: 'trainingCentres', label: 'Training Centres' },
    { key: 'coachingInstitutes', label: 'Coaching Institutes' },
    { key: 'banquetHalls', label: 'Banquet Halls' },
    { key: 'marriageGardens', label: 'Marriage Gardens' },
    { key: 'farmHouses', label: 'Farm Houses' },
    { key: 'coworkingSpaces', label: 'Coworking Spaces' },
    { key: 'schoolsColleges', label: 'Schools / Colleges' },
];

export default function StepVenueNetwork({ data, onChange, errors }: StepVenueNetworkProps) {
    const { venueNetwork, expectedPerformance } = data;

    const toggleVenueType = (key: keyof VenueNetwork) => {
        onChange(prev => ({
            ...prev,
            venueNetwork: { ...prev.venueNetwork, [key]: !prev.venueNetwork[key] },
        }));
    };

    const setPerformance = <K extends keyof AmbassadorRegistration['expectedPerformance']>(
        key: K,
        value: AmbassadorRegistration['expectedPerformance'][K],
    ) => {
        onChange(prev => ({
            ...prev,
            expectedPerformance: { ...prev.expectedPerformance, [key]: value },
        }));
    };

    return (
        <View>
            <Text style={styles.heading}>Part E & F: Venue Network & Expected Performance</Text>

            <Text style={styles.question}>
                Do you have existing contacts with any of these venue types?
            </Text>

            <View style={styles.grid}>
                {VENUE_TYPE_LABELS.map(({ key, label }) => (
                    <View key={key} style={styles.gridItem}>
                        <SelectableCard
                            label={label}
                            selected={venueNetwork[key]}
                            onToggle={() => toggleVenueType(key)}
                        />
                    </View>
                ))}
            </View>

            {!!errors.venueNetwork && (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={12} color={Colors.danger} />
                    <Text style={styles.errorText}>{errors.venueNetwork}</Text>
                </View>
            )}

            <View style={styles.spacer} />

            <View style={styles.pairRow}>
                <View style={styles.pairItem}>
                    <SelectField
                        label="Expected Venues Per Day"
                        value={expectedPerformance.venuesPerDay}
                        options={VENUES_PER_DAY_OPTIONS}
                        onSelect={v => setPerformance('venuesPerDay', v)}
                        error={errors.venuesPerDay}
                    />
                </View>
                <View style={styles.pairItem}>
                    <SelectField
                        label="Expected Venues Per Month"
                        value={expectedPerformance.venuesPerMonth}
                        options={VENUES_PER_MONTH_OPTIONS}
                        onSelect={v => setPerformance('venuesPerMonth', v)}
                        error={errors.venuesPerMonth}
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
        marginBottom: Spacing.md,
    },
    question: {
        fontSize: 13,
        fontWeight: Typography.medium,
        color: Colors.charcoalMid,
        marginBottom: Spacing.md,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    gridItem: { width: '48%' },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
    errorText: { fontSize: 11, color: Colors.danger, fontWeight: Typography.semiBold },
    spacer: { height: Spacing.lg },
    pairRow: { flexDirection: 'column', gap: Spacing.md },
    pairItem: { flex: 1 },
});
