'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { DealSheet, Settings } from '@/lib/supabase/types'

// Register Inter font from Google Fonts CDN
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2', fontWeight: 600 },
  ],
})

Font.register({
  family: 'Cormorant',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjornFLsS6V7w.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjQrLBJtUE.woff2', fontWeight: 600 },
  ],
})

const COLORS = {
  ink: '#0A0A0A',
  inkSoft: '#404040',
  inkMuted: '#737373',
  gold: '#C9A84C',
  navy: '#1E3A5F',
  border: '#E5E5E5',
  bgSubtle: '#FAFAFA',
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: 'Inter',
    color: COLORS.ink,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 24,
    borderBottom: `1pt solid ${COLORS.gold}`,
    marginBottom: 28,
  },
  brandName: {
    fontFamily: 'Cormorant',
    fontSize: 22,
    fontWeight: 600,
    color: COLORS.ink,
    marginBottom: 4,
  },
  brandAddress: {
    fontSize: 8,
    color: COLORS.inkMuted,
  },
  docMeta: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontFamily: 'Cormorant',
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.gold,
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 8,
    color: COLORS.inkMuted,
  },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.inkMuted,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  // Client + Date row
  twoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 32,
  },
  col: { flex: 1 },

  clientName: {
    fontFamily: 'Cormorant',
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.ink,
  },
  metaValue: {
    fontSize: 10,
    color: COLORS.ink,
  },

  // Vehicle card
  vehicleCard: {
    padding: 16,
    backgroundColor: COLORS.bgSubtle,
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 4,
  },
  vehicleTitle: {
    fontFamily: 'Cormorant',
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.ink,
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  specLabel: { fontSize: 9, color: COLORS.inkMuted },
  specValue: { fontSize: 9, color: COLORS.ink, fontWeight: 600 },

  // Pricing table
  priceTable: {
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottom: `1pt solid ${COLORS.border}`,
  },
  priceRowLast: { borderBottom: 'none' },
  priceLabel: { fontSize: 10, color: COLORS.ink },
  priceValueUsd: {
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.ink,
  },
  priceValueNgn: {
    fontSize: 8,
    color: COLORS.inkMuted,
  },

  // Total row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.ink,
    borderRadius: 4,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  totalUsd: {
    fontSize: 18,
    fontWeight: 600,
    color: COLORS.gold,
    fontFamily: 'Inter',
  },
  totalNgn: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
  },

  // Validity
  validity: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.bgSubtle,
    borderLeft: `2pt solid ${COLORS.gold}`,
    fontSize: 9,
    color: COLORS.inkSoft,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 16,
    borderTop: `1pt solid ${COLORS.border}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: COLORS.inkMuted,
  },
})

function formatUSDForPdf(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNGNForPdf(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateForPdf(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function calculateValidUntil(createdAt: string, validHours: number): string {
  const expiry = new Date(new Date(createdAt).getTime() + validHours * 60 * 60 * 1000)
  return formatDateForPdf(expiry.toISOString())
}

interface ProformaProps {
  deal: DealSheet
  settings: Partial<Settings>
}

export function ProformaPDF({ deal, settings }: ProformaProps) {
  const snapshot = deal.car_snapshot as {
    make: string
    model: string
    year: number
    color_exterior?: string | null
    condition?: string | null
    price_usd: number
  }

  const dealNumber = `PRO-${deal.id.slice(0, 8).toUpperCase()}`
  const businessName = settings.business_name ?? 'Polanco Exotic Cars'
  const businessAddress = settings.business_address ?? 'Plot 2, Km 33 Lekki-Epe Expressway, Lekki Phase 1'
  const whatsappNumber = settings.whatsapp_number ?? ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{businessName}</Text>
            <Text style={styles.brandAddress}>{businessAddress}</Text>
            {whatsappNumber && (
              <Text style={styles.brandAddress}>WhatsApp: {whatsappNumber}</Text>
            )}
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>PROFORMA INVOICE</Text>
            <Text style={styles.docNumber}>{dealNumber}</Text>
          </View>
        </View>

        {/* Client + Date */}
        <View style={[styles.section, styles.twoCol]}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Prepared for</Text>
            <Text style={styles.clientName}>{deal.client_name}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Date</Text>
            <Text style={styles.metaValue}>{formatDateForPdf(deal.created_at)}</Text>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleTitle}>
              {snapshot.year} {snapshot.make} {snapshot.model}
            </Text>
            {snapshot.condition && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Condition</Text>
                <Text style={styles.specValue}>{snapshot.condition}</Text>
              </View>
            )}
            {snapshot.color_exterior && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Exterior</Text>
                <Text style={styles.specValue}>{snapshot.color_exterior}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.priceTable}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Vehicle</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.priceValueUsd}>{formatUSDForPdf(deal.price_usd)}</Text>
                <Text style={styles.priceValueNgn}>
                  {formatNGNForPdf(deal.price_ngn)}
                </Text>
              </View>
            </View>

            {(deal.extras as Array<{ label: string; amount_usd: number }>).map((extra, i, arr) => {
              const ngn = Math.round(extra.amount_usd * deal.exchange_rate)
              return (
                <View
                  key={i}
                  style={[
                    styles.priceRow,
                    i === arr.length - 1 ? styles.priceRowLast : {},
                  ]}
                >
                  <Text style={styles.priceLabel}>{extra.label}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.priceValueUsd}>{formatUSDForPdf(extra.amount_usd)}</Text>
                    <Text style={styles.priceValueNgn}>{formatNGNForPdf(ngn)}</Text>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Total */}
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalNgn}>{formatNGNForPdf(deal.total_ngn)}</Text>
            </View>
            <Text style={styles.totalUsd}>{formatUSDForPdf(deal.total_usd)}</Text>
          </View>

          <Text style={styles.validity}>
            This quotation is valid for {deal.valid_hours} hours from the date issued.
            Exchange rate ₦{deal.exchange_rate.toLocaleString()} per US$1.
            Quotation expires on {calculateValidUntil(deal.created_at, deal.valid_hours)}.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{businessName}</Text>
          <Text style={styles.footerText}>{dealNumber}</Text>
        </View>
      </Page>
    </Document>
  )
}
