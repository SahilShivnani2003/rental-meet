import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    NavButtons,
    SectionCard,
    SectionTitle,
} from '@/components/UI/shared-components';
import Field from '@/components/UI/InputField';
import { Colors, Spacing, Typography } from '@/theme/theme';
import { VenueFormData } from '../types/VenueFormData';

interface Props {
    data: VenueFormData['socialLinks'];
    onChange: (data: VenueFormData['socialLinks']) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function StepSocialLinks({ data, onChange, onPrev, onNext }: Props) {
    const set = (key: keyof VenueFormData['socialLinks'], value: string) =>
        onChange({ ...data, [key]: value });

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <SectionCard accentColor={Colors.primary}>
                <SectionTitle
                    icon="share-social-outline"
                    title="Social pages"
                    subtitle="Help guests learn more about your venue online"
                />
                <Field
                    label="Website"
                    placeholder="https://yourvenue.com"
                    icon="globe-outline"
                    value={data.website}
                    onChangeText={value => set('website', value)}
                    keyboardType="url"
                    autoCapitalize="none"
                />
                <Field
                    label="Instagram"
                    placeholder="https://instagram.com/yourvenue"
                    icon="logo-instagram"
                    value={data.instagram}
                    onChangeText={value => set('instagram', value)}
                    keyboardType="url"
                    autoCapitalize="none"
                />
                <Field
                    label="Facebook"
                    placeholder="https://facebook.com/yourvenue"
                    icon="logo-facebook"
                    value={data.facebook}
                    onChangeText={value => set('facebook', value)}
                    keyboardType="url"
                    autoCapitalize="none"
                />
                <Field
                    label="YouTube links"
                    placeholder="Paste a video or channel link"
                    icon="logo-youtube"
                    value={data.youtube}
                    onChangeText={value => set('youtube', value)}
                    keyboardType="url"
                    autoCapitalize="none"
                />
                <View style={styles.note}>
                    <Text style={styles.noteText}>These links are optional and can be added or changed later.</Text>
                </View>
            </SectionCard>
            <NavButtons onPrev={onPrev} onNext={onNext} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { paddingBottom: Spacing.lg },
    note: {
        borderRadius: 10,
        backgroundColor: Colors.primaryHighLight,
        padding: Spacing.md,
        marginTop: Spacing.xs,
    },
    noteText: {
        color: Colors.charcoalLight,
        fontSize: Typography.sm,
        lineHeight: 18,
    },
});
