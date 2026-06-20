import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { useAlert } from '@/context/AlertContext';
import { generatePDF } from 'react-native-html-to-pdf';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceBookingLite {
    _id?: string;
    quotationNumber?: string;
    bookingNumber?: string;
    isTemporary?: boolean;
}

export interface ServiceVendorLite {
    title?: string;
    category?: string;
    city?: string;
    state?: string;
    companyName?: string;
    vendor?: { companyName?: string };
}

export interface ServiceFormLite {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    eventName?: string;
    notes?: string;
}

export interface ServicePackageItem {
    name: string;
    price: number;
    unit: string;
}

export interface ServicePricing {
    subtotal: number;
    serviceCgst: number;
    serviceSgst: number;
    cgstPct: number;
    sgstPct: number;
    platformFee: number;
    platformFeePct: number;
    platformFeeGst: number;
    platformCgstPct: number;
    platformSgstPct: number;
    total: number;
}

interface ServiceQuotationModalProps {
    visible: boolean;
    booking: ServiceBookingLite;
    svc: ServiceVendorLite;
    form: ServiceFormLite;
    selectedDate: string; // 'YYYY-MM-DD'
    quantities: Record<number, number>;
    packages: ServicePackageItem[];
    pricing: ServicePricing;
    onSave?: () => Promise<ServiceBookingLite | null>;
    onClose: () => void;
    onRecordAction?: (booking: ServiceBookingLite, action: 'download' | 'print') => void;
    logoBase64?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── HTML template — kept 1:1 with the web app's buildHTML ─────────────────────

function buildServiceQuotationHTML(
    booking: ServiceBookingLite,
    svc: ServiceVendorLite,
    form: ServiceFormLite,
    selectedDate: string,
    quantities: Record<number, number>,
    packages: ServicePackageItem[],
    pricing: ServicePricing,
    logoBase64?: string | null,
) {
    const {
        subtotal,
        serviceCgst,
        serviceSgst,
        cgstPct,
        sgstPct,
        platformFee,
        platformFeePct,
        platformFeeGst,
        platformCgstPct,
        platformSgstPct,
        total,
    } = pricing;

    const eventDateStr = selectedDate
        ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '—';
    const todayStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const selectedItems = (packages || [])
        .map((pkg, i) => ({ ...pkg, qty: quantities[i] || 0 }))
        .filter(p => p.qty > 0);

    const serviceTotal = subtotal + serviceCgst + serviceSgst;
    const platformTotal = platformFee + platformFeeGst;
    const qNo = booking?.quotationNumber || booking?.bookingNumber || '—';

    const itemRows = selectedItems
        .map(
            (item, i) => `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
        <td style="padding:5px 8px;font-size:10px">${item.name}</td>
        <td style="padding:5px 8px;text-align:right;font-size:10px">₹${(
            item.price || 0
        ).toLocaleString()}</td>
        <td style="padding:5px 8px;text-align:center;font-size:10px;color:#6b7280">${item.unit}</td>
        <td style="padding:5px 8px;text-align:center;font-size:10px;font-weight:600">${
            item.qty
        }</td>
        <td style="padding:5px 8px;text-align:right;font-size:10px;font-weight:700;color:#d97706">₹${(
            (item.price || 0) * item.qty
        ).toLocaleString()}</td>
      </tr>`,
        )
        .join('');

    const kv = (label: string, value?: string) =>
        value
            ? `<div style="display:flex;gap:4px;margin-bottom:3px;font-size:10px;line-height:1.4">
           <span style="color:#6b7280;white-space:nowrap;min-width:60px">${label}:</span>
           <span style="font-weight:600;color:#111827">${value}</span>
         </div>`
            : '';

    const body = `<div style="width:794px;background:#fff;padding:28px 32px;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;font-size:10px">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          ${
              logoBase64
                  ? `<img src="${logoBase64}" style="height:40px;object-fit:contain" alt="RentalMeet"/>`
                  : `<div style="font-size:22px;font-weight:900;color:#F59E0B">RentalMeet</div>`
          }
          <div style="font-size:9px;color:#6b7280;margin-top:2px">Premium Vendor Services Platform</div>
          <div style="font-size:9px;color:#9ca3af">booking@rentalmeet.com</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:900;color:#F59E0B;letter-spacing:1px">SERVICE QUOTATION</div>
          <div style="font-size:10px;color:#374151;margin-top:2px">No: <strong>${qNo}</strong></div>
          <div style="font-size:10px;color:#6b7280">Date: ${todayStr} &nbsp;|&nbsp; Valid: ${validUntil}</div>
          <div style="font-size:10px;color:#F59E0B;font-weight:700;margin-top:2px">Event: ${eventDateStr}</div>
        </div>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#F59E0B,#FCD34D);border-radius:2px;margin-bottom:12px"></div>

      <!-- Two columns -->
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px">
          <div style="font-size:9px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid #bfdbfe">BILLED TO</div>
          ${kv('Name', form?.name)}
          ${kv('Company', form?.company)}
          ${kv('Email', form?.email)}
          ${kv('Phone', form?.phone)}
          ${kv('Event', form?.eventName)}
        </div>
        <div style="flex:1;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px">
          <div style="font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid #fde68a">SERVICE PROVIDER</div>
          ${kv('Service', svc?.title)}
          ${kv('Category', svc?.category)}
          ${kv('Company', svc?.vendor?.companyName || svc?.companyName)}
          ${kv('Location', [svc?.city, svc?.state].filter(Boolean).join(', '))}
        </div>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <thead>
          <tr style="background:#F59E0B">
            <th style="padding:6px 8px;text-align:left;font-size:9px;font-weight:700;color:#fff;text-transform:uppercase">SERVICE / ITEM</th>
            <th style="padding:6px 8px;text-align:right;font-size:9px;font-weight:700;color:#fff">RATE</th>
            <th style="padding:6px 8px;text-align:center;font-size:9px;font-weight:700;color:#fff">UNIT</th>
            <th style="padding:6px 8px;text-align:center;font-size:9px;font-weight:700;color:#fff">QTY</th>
            <th style="padding:6px 8px;text-align:right;font-size:9px;font-weight:700;color:#fff">AMOUNT</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Two invoice boxes side by side -->
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="flex:1;background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:10px">
          <div style="font-size:10px;font-weight:800;color:#1e40af;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #93c5fd">SERVICE QUOTATION</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span>Service Amount</span><span>₹${fmt(
              subtotal,
          )}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#1d4ed8"><span>CGST (${cgstPct}%)</span><span>₹${fmt(
        serviceCgst,
    )}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#1d4ed8"><span>SGST (${sgstPct}%)</span><span>₹${fmt(
        serviceSgst,
    )}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#1e40af;border-top:2px solid #93c5fd;padding-top:6px;margin-top:4px"><span>Service Quotation Total</span><span>₹${fmt(
              serviceTotal,
          )}</span></div>
        </div>
        <div style="flex:1;background:#faf5ff;border:2px solid #c4b5fd;border-radius:8px;padding:10px">
          <div style="font-size:10px;font-weight:800;color:#6d28d9;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #c4b5fd">PLATFORM QUOTATION</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span>Platform Fee (${platformFeePct}%)</span><span>₹${fmt(
        platformFee,
    )}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#7c3aed"><span>CGST (${platformCgstPct}%)</span><span>₹${fmt(
        Math.round((platformFee * platformCgstPct) / 100),
    )}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#7c3aed"><span>SGST (${platformSgstPct}%)</span><span>₹${fmt(
        Math.round((platformFee * platformSgstPct) / 100),
    )}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#6d28d9;border-top:2px solid #c4b5fd;padding-top:6px;margin-top:4px"><span>Platform Quotation Total</span><span>₹${fmt(
              platformTotal,
          )}</span></div>
        </div>
      </div>

      <!-- Grand Total -->
      <div style="background:linear-gradient(135deg,#F59E0B,#FCD34D);border-radius:8px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Total Amount</span>
        <span style="font-size:12px;font-weight:800;color:#fff">₹${fmt(total)}</span>
      </div>

      ${
          form?.notes
              ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:10px"><strong>Special Requirements:</strong> ${form.notes}</div>`
              : ''
      }

      <div style="text-align:center;font-size:8px;color:#9ca3af;padding-top:8px;border-top:1px solid #e5e7eb">
        <div>Non-binding quotation · Valid 7 days · Final pricing subject to vendor confirmation</div>
        <div style="margin-top:2px">RentalMeet · booking@rentalmeet.com · Ref: ${qNo}</div>
      </div>
    </div>`;

    return {
        body,
        full: `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Service Quotation - ${qNo}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}@media print{body{margin:0}}</style></head><body>${body}</body></html>`,
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceQuotationModal({
    visible,
    booking,
    svc,
    form,
    selectedDate,
    quantities,
    packages,
    pricing,
    onSave,
    onClose,
    onRecordAction,
    logoBase64,
}: ServiceQuotationModalProps) {
    const alert = useAlert();
    const [activeBooking, setActiveBooking] = useState<ServiceBookingLite>(booking);
    const [printing, setPrinting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const qNo = activeBooking?.quotationNumber || activeBooking?.bookingNumber || '—';

    const html = useMemo(
        () =>
            buildServiceQuotationHTML(
                activeBooking,
                svc,
                form,
                selectedDate,
                quantities,
                packages,
                pricing,
                logoBase64,
            ),
        [activeBooking, svc, form, selectedDate, quantities, packages, pricing, logoBase64],
    );

    const ensureSavedBooking = async (): Promise<ServiceBookingLite | null> => {
        if (activeBooking?.isTemporary && onSave) {
            const saved = await onSave();
            if (saved) {
                setActiveBooking(saved);
                return saved;
            }
            alert.error?.('Save failed', 'Could not save the quotation. Please try again.');
            return null;
        }
        return activeBooking;
    };

    /**
     * Shared helper: renders the quotation HTML to a PDF via
     * react-native-html-to-pdf, then hands it to the OS share sheet via
     * react-native-share. On iOS the share sheet exposes a native "Print"
     * action for PDFs, and on Android it lets the user pick a print service
     * (e.g. "Save as PDF" / a connected printer) — so this one helper covers
     * both the "Print" and "PDF" buttons without depending on react-native-print.
     */
    const generateAndSharePDF = async (current: ServiceBookingLite, action: 'download' | 'print') => {
        const { full } = buildServiceQuotationHTML(
            current,
            svc,
            form,
            selectedDate,
            quantities,
            packages,
            pricing,
            logoBase64,
        );
        const fileName = `ServiceQuotation-${current.quotationNumber || current.bookingNumber}`;
        const pdf = await generatePDF({
            html: full,
            fileName,
            base64: false,
            width: 794,
            height: 1123,
            padding: 0,
        });

        if (pdf.filePath) {
            await Share.open({
                url: Platform.OS === 'android' ? `file://${pdf.filePath}` : pdf.filePath,
                type: 'application/pdf',
                failOnCancel: false,
            });
        }
        onRecordAction?.(current, action);
    };

    const handlePrint = async () => {
        setPrinting(true);
        try {
            const current = await ensureSavedBooking();
            if (!current) return;
            await generateAndSharePDF(current, 'print');
        } catch {
            // cancelled or failed silently — mirrors web's best-effort behavior
        } finally {
            setPrinting(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const current = await ensureSavedBooking();
            if (!current) return;
            await generateAndSharePDF(current, 'download');
        } catch {
            alert.error?.('PDF generation failed', 'Could not generate the PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={s.root}>
                {/* ── Header ── */}
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>Service Quotation</Text>
                        <Text style={s.headerSub}>{qNo}</Text>
                    </View>
                    <View style={s.headerActions}>
                        <TouchableOpacity
                            style={[s.actionPill, s.printPill]}
                            onPress={handlePrint}
                            activeOpacity={0.85}
                            disabled={printing || downloading}
                        >
                            {printing ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Ionicons name="print-outline" size={16} color={Colors.white} />
                            )}
                            <Text style={s.actionPillText}>
                                {printing ? 'Printing...' : 'Print'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.actionPill, s.pdfPill]}
                            onPress={handleDownloadPDF}
                            activeOpacity={0.85}
                            disabled={printing || downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Ionicons name="download-outline" size={16} color={Colors.white} />
                            )}
                            <Text style={s.actionPillText}>
                                {downloading ? 'Generating...' : 'PDF'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.headerBtn} onPress={onClose} activeOpacity={0.8}>
                            <Ionicons name="close" size={18} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.headerDivider} />

                {/* In-app native preview — informational only; Print/PDF render the
                    exact web-matching HTML above regardless of what's shown here. */}
                <ScrollView
                    style={s.previewBg}
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={s.previewNotice}>
                        <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color={Colors.primary}
                        />
                        <Text style={s.previewNoticeText}>
                            Use Print or PDF above for the official formatted service quotation
                            document.
                        </Text>
                    </View>

                    {/* Lightweight native summary so the user has something to glance at */}
                    <View style={s.summaryCard}>
                        <Text style={s.summaryTitle}>{svc?.title ?? 'Service'}</Text>
                        <Text style={s.summaryRow}>Customer: {form?.name ?? '—'}</Text>
                        <Text style={s.summaryRow}>Event: {form?.eventName ?? '—'}</Text>
                        <Text style={s.summaryRow}>
                            Items:{' '}
                            {(packages || []).filter((_, i) => (quantities[i] || 0) > 0).length}
                        </Text>
                        <View style={s.summaryDivider} />
                        <View style={s.summaryTotalRow}>
                            <Text style={s.summaryTotalLabel}>Total Amount</Text>
                            <Text style={s.summaryTotalValue}>₹{fmt(pricing.total)}</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* ── Footer ── */}
                <View style={s.footer}>
                    <TouchableOpacity style={s.footerBack} onPress={onClose} activeOpacity={0.8}>
                        <Ionicons name="arrow-back-outline" size={16} color={Colors.charcoalMid} />
                        <Text style={s.footerBackText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: 20,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        letterSpacing: -0.4,
    },
    headerSub: {
        fontSize: Typography.sm,
        color: Colors.charcoalLight,
        fontWeight: Typography.medium,
        marginTop: 2,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 18,
    },
    printPill: { backgroundColor: Colors.primary },
    pdfPill: { backgroundColor: Colors.success },
    actionPillText: { fontSize: 12, fontWeight: Typography.bold, color: Colors.white },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerDivider: { height: 1, backgroundColor: Colors.divider },
    previewBg: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
    previewNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primaryDim,
        borderRadius: Radii.md,
        padding: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    previewNoticeText: {
        flex: 1,
        fontSize: Typography.xs,
        color: Colors.primaryDark,
        fontWeight: Typography.medium,
    },
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    summaryTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.charcoal,
        marginBottom: Spacing.sm,
    },
    summaryRow: { fontSize: Typography.sm, color: Colors.charcoalMid, marginBottom: 4 },
    summaryDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },
    summaryTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryTotalLabel: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.charcoal,
    },
    summaryTotalValue: {
        fontSize: Typography.lg,
        fontWeight: Typography.extraBold,
        color: Colors.primary,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        ...Shadows.floating,
    },
    footerBack: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 50,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    footerBackText: {
        fontSize: Typography.base,
        fontWeight: Typography.semiBold,
        color: Colors.charcoalMid,
    },
});