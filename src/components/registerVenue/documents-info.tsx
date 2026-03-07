import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, Radii } from '../../theme/theme';
import Field from '../UI/input-field';
import {
    StepHeader,
    SectionCard,
    SectionTitle,
    NavButtons,
    PickerRow,
    FileUploadBtn,
} from '../UI/shared-components';

const ROLES = ['Select role', 'Owner', 'Manager', 'Partner', 'Director'];
const BUSINESS_PROOF_TYPES = [
    'Select type',
    'GST Certificate',
    'Shop License',
    'Trade License',
    'Partnership Deed',
    'Incorporation Certificate',
];
const ACCOUNT_TYPES = ['Select type', 'Savings', 'Current', 'Overdraft'];

interface Props {
    onPrev: () => void;
    onNext: () => void;
}

export default function Step6Documents({ onPrev, onNext }: Props) {
    // Owner Details
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [altMobile, setAltMobile] = useState('');
    const [role, setRole] = useState(ROLES[0]);
    const [roleOpen, setRoleOpen] = useState(false);

    // ID Proof
    const [idType, setIdType] = useState<'aadhaar' | 'pan'>('aadhaar');
    const [idNumber, setIdNumber] = useState('');

    // Business Docs
    const [bizProofType, setBizProofType] = useState(BUSINESS_PROOF_TYPES[0]);
    const [bpOpen, setBpOpen] = useState(false);

    // Bank Details
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0]);
    const [atOpen, setAtOpen] = useState(false);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
            <StepHeader title="Step 6: Documents" current={6} />

            {/* Owner Details */}
            <SectionCard accentColor={Colors.primary}>
                <SectionTitle icon="person-outline" title="Owner Details" />
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Full Name"
                            placeholder="John Doe"
                            icon="person-outline"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Email Address"
                            placeholder="john@example.com"
                            icon="mail-outline"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Mobile Number"
                            placeholder="9876543210"
                            icon="call-outline"
                            value={mobile}
                            onChangeText={setMobile}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Alternate Number"
                            placeholder="9876543210"
                            icon="call-outline"
                            value={altMobile}
                            onChangeText={setAltMobile}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>
                <Text style={s.pickerLabel}>
                    YOUR ROLE <Text style={s.req}>*</Text>
                </Text>
                <PickerRow
                    value={role}
                    options={ROLES}
                    open={roleOpen}
                    onToggle={() => setRoleOpen(!roleOpen)}
                    onSelect={v => {
                        setRole(v);
                        setRoleOpen(false);
                    }}
                />
            </SectionCard>

            {/* ID Proof */}
            <SectionCard accentColor={Colors.info}>
                <SectionTitle
                    icon="card-outline"
                    title="ID Proof"
                    iconColor={Colors.info}
                    bgColor={Colors.infoLight}
                />
                <Text style={s.subLabel}>Select ID Type</Text>
                <View style={s.radioRow}>
                    {(['aadhaar', 'pan'] as const).map(type => (
                        <TouchableOpacity
                            key={type}
                            style={s.radioItem}
                            onPress={() => setIdType(type)}
                            activeOpacity={0.8}
                        >
                            <View style={[s.radioCircle, idType === type && s.radioCircleActive]}>
                                {idType === type && <View style={s.radioInner} />}
                            </View>
                            <Text style={s.radioText}>
                                {type === 'aadhaar' ? 'Aadhaar' : 'PAN Card'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label={idType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'}
                            placeholder={idType === 'aadhaar' ? 'XXXX XXXX XXXX' : 'ABCDE1234F'}
                            icon="card-outline"
                            value={idNumber}
                            onChangeText={setIdNumber}
                            autoCapitalize={idType === 'pan' ? 'characters' : 'none'}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.uploadLabel}>
                            UPLOAD FRONT <Text style={s.req}>*</Text>
                        </Text>
                        <FileUploadBtn label="Choose File" onPress={() => {}} />
                    </View>
                </View>
                <Text style={[s.uploadLabel, { marginTop: Spacing.sm }]}>
                    UPLOAD BACK <Text style={s.req}>*</Text>
                </Text>
                <FileUploadBtn label="Choose File" onPress={() => {}} />
            </SectionCard>

            {/* Selfie */}
            <SectionCard accentColor={Colors.success}>
                <SectionTitle
                    icon="camera-outline"
                    title="Selfie Upload"
                    subtitle="Upload a clear photo of yourself"
                    iconColor={Colors.success}
                    bgColor={Colors.successLight}
                />
                <FileUploadBtn label="Take/Upload Selfie" onPress={() => {}} />
            </SectionCard>

            {/* Business Documentation */}
            <SectionCard accentColor={Colors.warning}>
                <SectionTitle
                    icon="briefcase-outline"
                    title="Business Documentation"
                    iconColor={Colors.warning}
                    bgColor={Colors.warningLight}
                />
                <Text style={s.pickerLabel}>
                    BUSINESS PROOF TYPE <Text style={s.req}>*</Text>
                </Text>
                <PickerRow
                    value={bizProofType}
                    options={BUSINESS_PROOF_TYPES}
                    open={bpOpen}
                    onToggle={() => setBpOpen(!bpOpen)}
                    onSelect={v => {
                        setBizProofType(v);
                        setBpOpen(false);
                    }}
                />
                <Text style={[s.uploadLabel, { marginTop: Spacing.md }]}>
                    UPLOAD DOCUMENT <Text style={s.req}>*</Text>
                </Text>
                <FileUploadBtn label="Choose File" onPress={() => {}} />
            </SectionCard>

            {/* Bank Details */}
            <SectionCard accentColor={Colors.primaryDark}>
                <SectionTitle
                    icon="card-outline"
                    title="Bank Details for Payouts"
                    iconColor={Colors.primaryDark}
                    bgColor={Colors.primaryLight}
                />
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Account Holder Name"
                            placeholder="Full Name"
                            icon="person-outline"
                            value={accountHolder}
                            onChangeText={setAccountHolder}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Account Number"
                            placeholder="Account Number"
                            icon="keypad-outline"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="IFSC Code"
                            placeholder="SBIN0001234"
                            icon="barcode-outline"
                            value={ifsc}
                            onChangeText={setIfsc}
                            autoCapitalize="characters"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Bank Name"
                            placeholder="State Bank of India"
                            icon="business-outline"
                            value={bankName}
                            onChangeText={setBankName}
                        />
                    </View>
                </View>
                <View style={s.row}>
                    <View style={{ flex: 1 }}>
                        <Field
                            label="Branch Name"
                            placeholder="Branch Name"
                            icon="location-outline"
                            value={branchName}
                            onChangeText={setBranchName}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.pickerLabel}>
                            ACCOUNT TYPE <Text style={s.req}>*</Text>
                        </Text>
                        <PickerRow
                            value={accountType}
                            options={ACCOUNT_TYPES}
                            open={atOpen}
                            onToggle={() => setAtOpen(!atOpen)}
                            onSelect={v => {
                                setAccountType(v);
                                setAtOpen(false);
                            }}
                        />
                    </View>
                </View>
                <View style={s.secureNote}>
                    <Ionicons name="lock-closed" size={12} color={Colors.primary} />
                    <Text style={s.secureText}>
                        Your bank details will be encrypted and stored securely
                    </Text>
                </View>
            </SectionCard>

            <NavButtons onPrev={onPrev} onNext={onNext} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    row: { flexDirection: 'row', gap: Spacing.sm },
    subLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
        marginBottom: Spacing.sm,
    },
    radioRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.md },
    radioItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleActive: { borderColor: Colors.primary },
    radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
    radioText: {
        fontSize: Typography.base,
        fontWeight: Typography.medium,
        color: Colors.charcoalMid,
    },
    pickerLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 7,
    },
    uploadLabel: {
        fontSize: 11,
        fontWeight: Typography.bold,
        color: Colors.charcoalMid,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    req: { color: Colors.primary },
    secureNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.md,
        padding: Spacing.sm,
        backgroundColor: Colors.primaryLight,
        borderRadius: Radii.sm,
    },
    secureText: { fontSize: Typography.xs, color: Colors.charcoalLight, flex: 1 },
});
