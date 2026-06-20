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
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// @ts-ignore
import  { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { Colors, Typography, Spacing, Radii, Shadows } from '@/theme/theme';
import { Venue } from '@/features/venue/types/Venue';
import { SelectedAmenityItem } from '@/features/venue/models/BookingSheet';
import { PlatformSettings } from '@/features/booking/types/PlatformSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuotationData {
    bookingDate: string;
    startTime: string;
    endTime: string;
    bookingType: 'hourly' | 'halfday' | 'fullday';
    durationLabel: string;
    isWeekend: boolean;

    customerName: string;
    customerEmail: string;
    customerPhone: string;
    eventType: string;
    guestCount: number;
    specialRequirements?: string;

    basePrice: number;
    amenitiesTotal: number;
    subtotal: number;
    venueCGST: number;
    venueCGSTRate: number;
    venueSGST: number;
    venueSGSTRate: number;
    venueGSTTotal: number;
    platformFee: number;
    platformFeeLabel: string;
    platformFeePercentage?: number;
    platformCGST: number;
    platformCGSTRate: number;
    platformSGST: number;
    platformSGSTRate: number;
    platformFeeTotal: number;
    grandTotal: number;
    discount?: number;
    couponCode?: string;

    paidAmenities: SelectedAmenityItem[];
    allAmenities: SelectedAmenityItem[];

    quotationNumber: string;
    generatedAt: Date;
    validUntil: Date;
}

interface QuotationModalProps {
    visible: boolean;
    venue: Venue;
    quotationData: QuotationData;
    platformSettings: PlatformSettings & {
        gstInvoiceSignature?: string;
        platformInvoiceSignature?: string;
    };
    onClose: () => void;
    onConfirmBooking: () => void;
    confirmLoading?: boolean;
    /** Optional — call your backend the same way the web app's recordToBackend does */
    onRecordAction?: (action: 'download' | 'print') => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d: Date | string) => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── HTML template — kept 1:1 with the web app's commonCSS / htmlContent ───────

function buildQuotationHTML(
    venue: Venue,
    qd: QuotationData,
    platformSettings: QuotationModalProps['platformSettings'],
) {
    const baseAmount = (qd.basePrice || 0) + (qd.amenitiesTotal || 0);
    const platformPct = qd.platformFeePercentage ?? 0;
    const couponDiscount = qd.discount || 0;
    const subtotalBeforeDiscount = qd.subtotal + qd.venueGSTTotal + qd.platformFeeTotal;
    const grandTotal = Math.max(0, subtotalBeforeDiscount - couponDiscount) || qd.grandTotal;

    const included = qd.allAmenities.filter(a => a.category === 'basic_included');
    const paid = qd.paidAmenities;

    const amenRows = paid
        .map(
            a =>
                `<tr><td style="padding-left:18px">${a.name}</td><td>${
                    a.qty
                }</td><td style="text-align:right">₹${fmt(
                    a.unitPrice,
                )}</td><td style="text-align:right">₹${fmt(a.total)}</td></tr>`,
        )
        .join('');

    const includedRows = included
        .map(
            a =>
                `<tr><td style="padding-left:18px">${a.name} <span style="font-size:8px;color:#16a34a;font-weight:700">(Included)</span></td><td>1</td><td style="text-align:right">—</td><td style="text-align:right">₹0</td></tr>`,
        )
        .join('');

    const sigVenue = platformSettings?.gstInvoiceSignature;
    const sigPlatform = platformSettings?.platformInvoiceSignature;

    const css = `
      *{margin:0;padding:0;box-sizing:border-box}
      body,div{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1f2937;-webkit-print-color-adjust:exact}
      .wrap{width:794px;background:#fff;padding:32px 36px}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
      .brand{font-size:20px;font-weight:800;color:#F59E0B}
      .brand-sub{font-size:9px;color:#6b7280;margin-top:2px}
      .inv-right{text-align:right}
      .inv-title{font-size:20px;font-weight:800;letter-spacing:1px;margin-bottom:3px;color:#F59E0B}
      .inv-no{font-size:10px;color:#6b7280;margin-bottom:1px}
      .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:.5px;margin-top:4px;background:#fef3c7;color:#92400e}
      .divider{height:3px;border-radius:2px;margin-bottom:16px;background:linear-gradient(90deg,#F59E0B,#FCD34D)}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:16px}
      .meta-label{font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .meta-val{font-size:12px;font-weight:800;color:#111827}
      .meta-right{text-align:right}
      .two-col{display:flex;gap:12px;margin-bottom:16px}
      .card{flex:1;border-radius:8px;padding:12px;border:1px solid}
      .card-title{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid}
      .card-row{margin-bottom:5px}
      .card-label{font-size:8px;color:#9ca3af;margin-bottom:1px}
      .card-val{font-size:10px;font-weight:600;color:#111827}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{padding:7px 9px;text-align:left;font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#fff}
      td{padding:6px 9px;border-bottom:1px solid #f3f4f6;font-size:10px;vertical-align:top}
      .right{text-align:right}
      .totals{border-radius:8px;padding:12px 14px;margin-bottom:14px}
      .tot-row{display:flex;justify-content:space-between;padding:3px 0;font-size:10px}
      .tot-grand{font-size:13px;font-weight:800;border-top:2px solid rgba(0,0,0,.15);margin-top:5px;padding-top:7px}
      .inv-section{border:3px solid;border-radius:10px;padding:16px;margin-bottom:16px}
      .inv-section-title{font-size:14px;font-weight:900;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid}
      .grand-box{border-radius:10px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
      .sig-area{display:flex;justify-content:flex-end;margin-bottom:12px}
      .sig-box{text-align:center;min-width:130px}
      .sig-img{height:44px;margin-bottom:3px;object-fit:contain}
      .sig-line{border-top:1px solid #374151;padding-top:3px;font-size:8px;font-weight:600;color:#374151}
      .footer{text-align:center;font-size:8px;color:#9ca3af;padding-top:8px;border-top:1px solid #e5e7eb}
      @media print{body{padding:16px}}
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Quotation - ${
        qd.quotationNumber
    }</title><style>${css}</style></head><body>
    <div class="wrap">
      <div class="hdr">
        <div>
          <div class="brand">RentalMeet</div>
          <div class="brand-sub">Venue Booking Platform</div>
          <div style="font-size:9px;color:#6b7280;margin-top:2px">bookings@rentalmeet.com | +91 98765 43210</div>
        </div>
        <div class="inv-right">
          <div class="inv-title">BOOKING QUOTATION</div>
          <div class="inv-no">Quotation No: <strong>${qd.quotationNumber}</strong></div>
          <div class="inv-no">Date: ${fmtDate(qd.generatedAt)}</div>
          <span class="badge">DRAFT</span>
        </div>
      </div>
      <div class="divider"></div>

      <div class="meta">
        <div><div class="meta-label">Valid Until</div><div class="meta-val">${fmtDate(
            qd.validUntil,
        )}</div></div>
        <div class="meta-right"><div class="meta-label">Status</div><div class="meta-val" style="color:#F59E0B">DRAFT</div></div>
      </div>

      <div class="two-col">
        <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
          <div class="card-title" style="color:#1e40af;border-color:#bfdbfe">Venue Details</div>
          <div class="card-row"><div class="card-label">Venue</div><div class="card-val">${
              venue.businessName
          }</div></div>
          <div class="card-row"><div class="card-label">Location</div><div class="card-val">${
              venue.location?.city || ''
          }${venue.location?.area ? ', ' + venue.location.area : ''}</div></div>
          <div class="card-row"><div class="card-label">Address</div><div class="card-val">${
              venue.location?.address || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Capacity</div><div class="card-val">${
              venue.capacity || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Date</div><div class="card-val">${fmtDate(
              qd.bookingDate,
          )}</div></div>
          <div class="card-row"><div class="card-label">Time</div><div class="card-val">${
              qd.startTime
          } – ${qd.endTime} (${qd.bookingType})</div></div>
        </div>
        <div class="card" style="background:#f0fdf4;border-color:#bbf7d0">
          <div class="card-title" style="color:#166534;border-color:#bbf7d0">Customer Details</div>
          <div class="card-row"><div class="card-label">Name</div><div class="card-val">${
              qd.customerName || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Email</div><div class="card-val">${
              qd.customerEmail || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${
              qd.customerPhone || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Event Type</div><div class="card-val">${
              qd.eventType || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Guests</div><div class="card-val">${
              qd.guestCount || '—'
          }</div></div>
          <div class="card-row"><div class="card-label">Day Type</div><div class="card-val">${
              qd.isWeekend ? 'Weekend' : 'Weekday'
          }</div></div>
        </div>
      </div>

      <!-- Invoice 1: Venue -->
      <div class="inv-section" style="border-color:#93c5fd;background:linear-gradient(135deg,#eff6ff,#fff)">
        <div class="inv-section-title" style="color:#1e40af;border-color:#93c5fd">📄 INVOICE 1: VENUE RENTAL &nbsp;<span style="font-size:10px;font-weight:600;color:#6b7280">${
            qd.quotationNumber
        }-V</span></div>
        <table>
          <thead><tr style="background:#F59E0B"><th>Description</th><th>Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
          <tbody>
            <tr><td><strong>Venue Rental – ${
                venue.businessName
            }</strong><br><span style="font-size:8px;color:#6b7280">${fmtDate(qd.bookingDate)} | ${
        qd.startTime
    } – ${qd.endTime}</span></td><td style="text-transform:capitalize">${
        qd.bookingType
    }</td><td class="right">—</td><td class="right"><strong>₹${fmt(qd.basePrice)}</strong></td></tr>
            ${
                includedRows || amenRows
                    ? `<tr style="background:#fef9c3"><td colspan="4" style="font-size:8px;font-weight:700;color:#92400e;padding:4px 9px">AMENITIES & SERVICES</td></tr>${includedRows}${amenRows}`
                    : ''
            }
            ${
                qd.amenitiesTotal > 0
                    ? `<tr style="background:#f9fafb"><td colspan="3"><strong>Amenities Subtotal</strong></td><td class="right"><strong>₹${fmt(
                          qd.amenitiesTotal,
                      )}</strong></td></tr>`
                    : ''
            }
          </tbody>
        </table>
        <div class="totals" style="background:#eff6ff;border:1px solid #bfdbfe">
          <div class="tot-row"><span>Subtotal (Rental + Amenities)</span><span>₹${fmt(
              qd.subtotal,
          )}</span></div>
          <div class="tot-row" style="color:#1d4ed8"><span>CGST (${
              qd.venueCGSTRate
          }%)</span><span>₹${fmt(qd.venueCGST)}</span></div>
          <div class="tot-row" style="color:#1d4ed8"><span>SGST (${
              qd.venueSGSTRate
          }%)</span><span>₹${fmt(qd.venueSGST)}</span></div>
          <div class="tot-row tot-grand" style="color:#1e40af"><span>Venue Invoice Total</span><span>₹${fmt(
              qd.subtotal + qd.venueGSTTotal,
          )}</span></div>
        </div>
        ${
            sigVenue
                ? `<div class="sig-area"><div class="sig-box"><img src="${sigVenue}" class="sig-img"/><div class="sig-line">Authorized Signatory</div></div></div>`
                : ''
        }
      </div>

      <!-- Invoice 2: Platform -->
      <div class="inv-section" style="border-color:#c4b5fd;background:linear-gradient(135deg,#faf5ff,#fff)">
        <div class="inv-section-title" style="color:#6d28d9;border-color:#c4b5fd">📄 INVOICE 2: PLATFORM FEE &nbsp;<span style="font-size:10px;font-weight:600;color:#6b7280">${
            qd.quotationNumber
        }-P</span></div>
        <table>
          <thead><tr style="background:#7c3aed"><th>Description</th><th>Rate</th><th class="right">Base Amount</th><th class="right">Amount</th></tr></thead>
          <tbody>
            <tr><td><strong>Platform Service Fee</strong><br><span style="font-size:8px;color:#6b7280">Booking facilitation for ${
                venue.businessName
            } on ${fmtDate(
        qd.bookingDate,
    )}</span></td><td>${platformPct}% </td><td class="right">₹${fmt(
        baseAmount,
    )}</td><td class="right"><strong>₹${fmt(qd.platformFee)}</strong></td></tr>
          </tbody>
        </table>
        <div class="totals" style="background:#faf5ff;border:1px solid #c4b5fd">
          <div class="tot-row"><span>${qd.platformFeeLabel}</span><span>₹${fmt(
        qd.platformFee,
    )}</span></div>
          <div class="tot-row" style="color:#7c3aed"><span>CGST (${
              qd.platformCGSTRate
          }%)</span><span>₹${fmt(qd.platformCGST)}</span></div>
          <div class="tot-row" style="color:#7c3aed"><span>SGST (${
              qd.platformSGSTRate
          }%)</span><span>₹${fmt(qd.platformSGST)}</span></div>
          <div class="tot-row tot-grand" style="color:#6d28d9"><span>Platform Invoice Total</span><span>₹${fmt(
              qd.platformFeeTotal,
          )}</span></div>
        </div>
        ${
            sigPlatform
                ? `<div class="sig-area"><div class="sig-box"><img src="${sigPlatform}" class="sig-img"/><div class="sig-line">Authorized Signatory</div></div></div>`
                : ''
        }
      </div>

      <!-- Grand Total -->
      <div class="grand-box" style="background:linear-gradient(135deg,#16a34a,#22c55e)">
        <div>
          <div style="font-size:11px;color:rgba(255,255,255,.8)">Venue Total + Platform Total${
              couponDiscount > 0 ? ' − Coupon Discount' : ''
          }</div>
          <div style="font-size:18px;font-weight:900;color:#fff">GRAND TOTAL</div>
        </div>
        <div style="font-size:28px;font-weight:900;color:#fff">₹${fmt(grandTotal)}</div>
      </div>

      ${
          qd.specialRequirements
              ? `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:10px"><strong>Special Requirements:</strong> ${qd.specialRequirements}</div>`
              : ''
      }

      <div class="footer">
        <p><strong>RentalMeet</strong> — Venue Booking Platform &nbsp;|&nbsp; bookings@rentalmeet.com &nbsp;|&nbsp; +91 98765 43210</p>
        <p style="margin-top:2px">Quotation Ref: ${
            qd.quotationNumber
        } &nbsp;|&nbsp; Valid for 7 days &nbsp;|&nbsp; Non-binding quotation, not a confirmed booking.</p>
      </div>
    </div>
  </body></html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuotationModal({
    visible,
    venue,
    quotationData: qd,
    platformSettings,
    onClose,
    onConfirmBooking,
    confirmLoading = false,
    onRecordAction,
}: QuotationModalProps) {
    const [printing, setPrinting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const html = useMemo(
        () => buildQuotationHTML(venue, qd, platformSettings),
        [venue, qd, platformSettings],
    );

    // Derived numbers for the native preview — mirrors the math inside buildQuotationHTML
    const computed = useMemo(() => {
        const couponDiscount = qd.discount || 0;
        const subtotalBeforeDiscount = qd.subtotal + qd.venueGSTTotal + qd.platformFeeTotal;
        const grandTotal = Math.max(0, subtotalBeforeDiscount - couponDiscount) || qd.grandTotal;
        const included = (qd.allAmenities || []).filter(a => a.category === 'basic_included');
        return { couponDiscount, grandTotal, included };
    }, [qd]);

    /**
     * Shared helper: renders the quotation HTML to a PDF via
     * react-native-html-to-pdf, then hands it to the OS share sheet via
     * react-native-share. On iOS the share sheet exposes a native "Print"
     * action for PDFs, and on Android it lets the user pick a print service
     * (e.g. "Save as PDF" / a connected printer) — so this one helper covers
     * both the "Print" and "PDF" buttons without depending on react-native-print.
     */
    const generateAndSharePDF = async (action: 'download' | 'print') => {
        const fileName = `RentalMeet_Quotation_${qd.quotationNumber}`;
        const pdf = await generatePDF({
            html,
            fileName,
            base64: false,
            width: 794,
            height: 1123,
            padding: 0,
        });
        if (!pdf?.filePath) {
            throw new Error('PDF generation did not return a file path');
        }

        // react-native-html-to-pdf returns a bare filesystem path (no scheme) on
        // BOTH iOS and Android. react-native-share needs a "file://" URI to open
        // a local file — without it, Share.open silently fails on iOS.
        const fileUrl = pdf.filePath.startsWith('file://')
            ? pdf.filePath
            : `file://${pdf.filePath}`;

        await Share.open({
            url: fileUrl,
            type: 'application/pdf',
            failOnCancel: false,
        });
        onRecordAction?.(action);
    };

    const handlePrint = async () => {
        try {
            setPrinting(true);
            await generateAndSharePDF('print');
        } catch (err: any) {
            if (err?.message !== 'User did not share') {
                console.error('Quotation print failed:', err);
                Alert.alert(
                    'Could not open Print',
                    err?.message ||
                        'Something went wrong generating the PDF. Make sure react-native-html-to-pdf and react-native-share are installed and linked (run pod install on iOS / rebuild the Android app).',
                );
            }
        } finally {
            setPrinting(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            await generateAndSharePDF('download');
        } catch (err: any) {
            if (err?.message !== 'User did not share') {
                console.error('Quotation PDF download failed:', err);
                Alert.alert(
                    'Could not generate PDF',
                    err?.message ||
                        'Something went wrong generating the PDF. Make sure react-native-html-to-pdf and react-native-share are installed and linked (run pod install on iOS / rebuild the Android app).',
                );
            }
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
                {/* ── Modal header ── */}
                <View style={s.header}>
                    <View>
                        <Text style={s.headerTitle}>Booking Quotation</Text>
                        <Text style={s.headerSub}>{qd.quotationNumber}</Text>
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
                            <Text style={s.actionPillText}>Print</Text>
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
                            <Text style={s.actionPillText}>PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.headerBtn} onPress={onClose} activeOpacity={0.8}>
                            <Ionicons name="close" size={18} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={s.headerDivider} />

                {/* In-app native preview — Print/PDF above still render the exact
                    web-matching HTML regardless of what's shown here. */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    <View style={s.previewNotice}>
                        <Ionicons
                            name="information-circle-outline"
                            size={14}
                            color={Colors.primary}
                        />
                        <Text style={s.previewNoticeText}>
                            This is a quick summary — tap Print or PDF above for the full formatted
                            document.
                        </Text>
                    </View>

                    {/* Venue + Customer */}
                    <View style={s.twoColRow}>
                        <View
                            style={[s.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                        >
                            <Text
                                style={[
                                    s.cardTitle,
                                    { color: '#1e40af', borderBottomColor: '#bfdbfe' },
                                ]}
                            >
                                Venue Details
                            </Text>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Venue</Text>
                                <Text style={s.cardVal}>{venue.businessName}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Location</Text>
                                <Text style={s.cardVal}>
                                    {[venue.location?.city, venue.location?.area]
                                        .filter(Boolean)
                                        .join(', ') || '—'}
                                </Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Address</Text>
                                <Text style={s.cardVal}>{venue.location?.address || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Capacity</Text>
                                <Text style={s.cardVal}>{venue.capacity || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Date</Text>
                                <Text style={s.cardVal}>{fmtDate(qd.bookingDate)}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Time</Text>
                                <Text style={s.cardVal}>
                                    {qd.startTime} – {qd.endTime} ({qd.bookingType})
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[s.card, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                        >
                            <Text
                                style={[
                                    s.cardTitle,
                                    { color: '#166534', borderBottomColor: '#bbf7d0' },
                                ]}
                            >
                                Customer Details
                            </Text>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Name</Text>
                                <Text style={s.cardVal}>{qd.customerName || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Email</Text>
                                <Text style={s.cardVal}>{qd.customerEmail || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Phone</Text>
                                <Text style={s.cardVal}>{qd.customerPhone || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Event Type</Text>
                                <Text style={s.cardVal}>{qd.eventType || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Guests</Text>
                                <Text style={s.cardVal}>{qd.guestCount || '—'}</Text>
                            </View>
                            <View style={s.cardRow}>
                                <Text style={s.cardLabel}>Day Type</Text>
                                <Text style={s.cardVal}>
                                    {qd.isWeekend ? 'Weekend' : 'Weekday'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Invoice 1: Venue */}
                    <View
                        style={[
                            s.invoiceSection,
                            { borderColor: '#93c5fd', backgroundColor: '#f5f9ff' },
                        ]}
                    >
                        <Text
                            style={[
                                s.invoiceSectionTitle,
                                { color: '#1e40af', borderBottomColor: '#93c5fd' },
                            ]}
                        >
                            📄 Invoice 1: Venue Rental
                        </Text>

                        <View style={s.lineItemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.lineItemName}>
                                    Venue Rental – {venue.businessName}
                                </Text>
                                <Text style={s.lineItemMeta}>
                                    {fmtDate(qd.bookingDate)} | {qd.startTime} – {qd.endTime}
                                </Text>
                            </View>
                            <Text style={s.lineItemAmount}>₹{fmt(qd.basePrice)}</Text>
                        </View>

                        {computed.included.map((a, i) => (
                            <View key={`inc-${i}`} style={s.amenityRow}>
                                <Text style={s.amenityName}>
                                    {a.name} <Text style={s.amenityIncludedTag}>(Included)</Text>
                                </Text>
                                <Text style={s.amenityAmount}>₹0</Text>
                            </View>
                        ))}
                        {(qd.paidAmenities || []).map((a, i) => (
                            <View key={`paid-${i}`} style={s.amenityRow}>
                                <Text style={s.amenityName}>
                                    {a.name} × {a.qty}
                                </Text>
                                <Text style={s.amenityAmount}>₹{fmt(a.total)}</Text>
                            </View>
                        ))}

                        <View
                            style={[
                                s.totalsBox,
                                {
                                    backgroundColor: '#eff6ff',
                                    borderWidth: 1,
                                    borderColor: '#bfdbfe',
                                },
                            ]}
                        >
                            <View style={s.totRow}>
                                <Text style={s.totLabel}>Subtotal (Rental + Amenities)</Text>
                                <Text style={s.totValue}>₹{fmt(qd.subtotal)}</Text>
                            </View>
                            <View style={s.totRow}>
                                <Text style={[s.totLabel, { color: '#1d4ed8' }]}>
                                    CGST ({qd.venueCGSTRate}%)
                                </Text>
                                <Text style={[s.totValue, { color: '#1d4ed8' }]}>
                                    ₹{fmt(qd.venueCGST)}
                                </Text>
                            </View>
                            <View style={s.totRow}>
                                <Text style={[s.totLabel, { color: '#1d4ed8' }]}>
                                    SGST ({qd.venueSGSTRate}%)
                                </Text>
                                <Text style={[s.totValue, { color: '#1d4ed8' }]}>
                                    ₹{fmt(qd.venueSGST)}
                                </Text>
                            </View>
                            <View style={[s.totGrandRow, { borderTopColor: '#93c5fd' }]}>
                                <Text style={[s.totGrandLabel, { color: '#1e40af' }]}>
                                    Venue Invoice Total
                                </Text>
                                <Text style={[s.totGrandValue, { color: '#1e40af' }]}>
                                    ₹{fmt(qd.subtotal + qd.venueGSTTotal)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Invoice 2: Platform */}
                    <View
                        style={[
                            s.invoiceSection,
                            { borderColor: '#c4b5fd', backgroundColor: '#faf8ff' },
                        ]}
                    >
                        <Text
                            style={[
                                s.invoiceSectionTitle,
                                { color: '#6d28d9', borderBottomColor: '#c4b5fd' },
                            ]}
                        >
                            📄 Invoice 2: Platform Fee
                        </Text>

                        <View style={s.lineItemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.lineItemName}>Platform Service Fee</Text>
                                <Text style={s.lineItemMeta}>
                                    Booking facilitation for {venue.businessName}
                                </Text>
                            </View>
                            <Text style={s.lineItemAmount}>₹{fmt(qd.platformFee)}</Text>
                        </View>

                        <View
                            style={[
                                s.totalsBox,
                                {
                                    backgroundColor: '#faf5ff',
                                    borderWidth: 1,
                                    borderColor: '#c4b5fd',
                                },
                            ]}
                        >
                            <View style={s.totRow}>
                                <Text style={s.totLabel}>{qd.platformFeeLabel}</Text>
                                <Text style={s.totValue}>₹{fmt(qd.platformFee)}</Text>
                            </View>
                            <View style={s.totRow}>
                                <Text style={[s.totLabel, { color: '#7c3aed' }]}>
                                    CGST ({qd.platformCGSTRate}%)
                                </Text>
                                <Text style={[s.totValue, { color: '#7c3aed' }]}>
                                    ₹{fmt(qd.platformCGST)}
                                </Text>
                            </View>
                            <View style={s.totRow}>
                                <Text style={[s.totLabel, { color: '#7c3aed' }]}>
                                    SGST ({qd.platformSGSTRate}%)
                                </Text>
                                <Text style={[s.totValue, { color: '#7c3aed' }]}>
                                    ₹{fmt(qd.platformSGST)}
                                </Text>
                            </View>
                            <View style={[s.totGrandRow, { borderTopColor: '#c4b5fd' }]}>
                                <Text style={[s.totGrandLabel, { color: '#6d28d9' }]}>
                                    Platform Invoice Total
                                </Text>
                                <Text style={[s.totGrandValue, { color: '#6d28d9' }]}>
                                    ₹{fmt(qd.platformFeeTotal)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Grand Total */}
                    <View style={s.grandBox}>
                        <View>
                            <Text style={s.grandLabel}>
                                Venue Total + Platform Total
                                {computed.couponDiscount > 0 ? ' − Coupon Discount' : ''}
                            </Text>
                            <Text style={s.grandTitle}>GRAND TOTAL</Text>
                        </View>
                        <Text style={s.grandValue}>₹{fmt(computed.grandTotal)}</Text>
                    </View>

                    {qd.specialRequirements ? (
                        <View style={s.specialBox}>
                            <Text style={s.specialText}>
                                <Text style={{ fontWeight: Typography.bold }}>
                                    Special Requirements:{' '}
                                </Text>
                                {qd.specialRequirements}
                            </Text>
                        </View>
                    ) : null}

                    <Text style={s.footerNote}>
                        Quotation Ref: {qd.quotationNumber} · Valid until {fmtDate(qd.validUntil)} ·
                        Non-binding quotation, not a confirmed booking.
                    </Text>
                </ScrollView>

                {/* ── Footer CTA ── */}
                <View style={s.footer}>
                    <TouchableOpacity style={s.footerBack} onPress={onClose} activeOpacity={0.8}>
                        <Ionicons name="arrow-back-outline" size={16} color={Colors.charcoalMid} />
                        <Text style={s.footerBackText}>Back to Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.footerConfirm, confirmLoading && s.footerConfirmDisabled]}
                        onPress={onConfirmBooking}
                        activeOpacity={0.85}
                        disabled={confirmLoading}
                    >
                        {confirmLoading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={17}
                                    color={Colors.white}
                                />
                                <Text style={s.footerConfirmText}>Confirm & Pay</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },
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

    twoColRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    card: { flex: 1, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1 },
    cardTitle: {
        fontSize: 10,
        fontWeight: Typography.extraBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        paddingBottom: 4,
        borderBottomWidth: 1,
    },
    cardRow: { marginBottom: 6 },
    cardLabel: { fontSize: 9, color: Colors.charcoalLight, marginBottom: 1 },
    cardVal: { fontSize: 12, fontWeight: Typography.semiBold, color: Colors.charcoal },

    invoiceSection: {
        borderWidth: 2,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    invoiceSectionTitle: {
        fontSize: 14,
        fontWeight: Typography.extraBold,
        marginBottom: Spacing.sm,
        paddingBottom: 6,
        borderBottomWidth: 1.5,
    },
    lineItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    lineItemName: { fontSize: 12, fontWeight: Typography.semiBold, color: Colors.charcoal },
    lineItemMeta: { fontSize: 10, color: Colors.charcoalLight, marginTop: 2 },
    lineItemAmount: { fontSize: 12, fontWeight: Typography.bold, color: Colors.charcoal },
    amenityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingLeft: Spacing.md,
    },
    amenityName: { fontSize: 11, color: Colors.charcoalMid, flex: 1 },
    amenityIncludedTag: { fontSize: 9, color: '#16a34a', fontWeight: Typography.bold },
    amenityAmount: { fontSize: 11, fontWeight: Typography.semiBold, color: Colors.charcoal },

    totalsBox: { borderRadius: Radii.md, padding: Spacing.sm, marginTop: Spacing.sm },
    totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totLabel: { fontSize: 11, color: Colors.charcoalMid },
    totValue: { fontSize: 11, color: Colors.charcoalMid },
    totGrandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 2,
        marginTop: 6,
        paddingTop: 8,
    },
    totGrandLabel: { fontSize: 13, fontWeight: Typography.extraBold },
    totGrandValue: { fontSize: 13, fontWeight: Typography.extraBold },

    grandBox: {
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        backgroundColor: '#16a34a',
    },
    grandLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
    grandTitle: { fontSize: 17, fontWeight: Typography.extraBold, color: Colors.white },
    grandValue: { fontSize: 26, fontWeight: Typography.extraBold, color: Colors.white },

    specialBox: {
        backgroundColor: '#fefce8',
        borderWidth: 1,
        borderColor: '#fde68a',
        borderRadius: Radii.md,
        padding: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    specialText: { fontSize: 11, color: Colors.charcoal },

    footerNote: {
        textAlign: 'center',
        fontSize: 10,
        color: Colors.charcoalLight,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        ...Shadows.floating,
    },
    footerBack: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.lg,
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
    footerConfirm: {
        flex: 1,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderRadius: Radii.full,
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    footerConfirmDisabled: { opacity: 0.5 },
    footerConfirmText: {
        fontSize: Typography.base,
        fontWeight: Typography.extraBold,
        color: Colors.white,
        letterSpacing: 0.2,
    },
});
