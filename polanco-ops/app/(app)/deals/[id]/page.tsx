'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/Button'
import { formatUSD, formatNGN, formatDate } from '@/lib/formatters'
import { ProformaPDF } from '@/lib/pdf/generateProforma'
import type { DealSheet } from '@/lib/supabase/types'

// PDFViewer relies on browser APIs (window, canvas) — load it client-side only
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-surface-muted animate-pulse rounded-xl" />,
  }
)

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: settings } = useSettings()
  const [deal, setDeal] = useState<DealSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function fetchDeal() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('deal_sheets')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) setDeal(data as DealSheet)
      setLoading(false)
    }
    fetchDeal()
  }, [id])

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="h-8 w-32 bg-surface-muted rounded-lg animate-pulse mb-4" />
        <div className="h-48 bg-surface-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-danger font-inter">Deal not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-navy font-inter underline">
          Go back
        </button>
      </div>
    )
  }

  const snapshot = deal.car_snapshot as {
    make: string
    model: string
    year: number
  }
  const carLabel = `${snapshot.year} ${snapshot.make} ${snapshot.model}`
  const filename = `proforma-${deal.client_name.replace(/\s+/g, '-').toLowerCase()}-${deal.id.slice(0, 8)}.pdf`

  const expiryDate = new Date(
    new Date(deal.created_at).getTime() + deal.valid_hours * 60 * 60 * 1000
  )

  async function handleDownload() {
    if (!deal || !settings) return
    setDownloading(true)
    try {
      // pdf() must be imported dynamically — it touches browser APIs
      const { pdf } = await import('@react-pdf/renderer')
      const blob = await pdf(
        <ProformaPDF deal={deal} settings={settings} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation error:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="pb-8">
      {/* Back */}
      <div className="px-4 pt-2 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-ink-muted font-inter hover:text-ink transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} />
          Deals
        </button>
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* Summary card */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-4">
          <p className="font-inter text-xs text-ink-muted mb-1">CLIENT</p>
          <p className="font-display text-xl font-semibold text-ink mb-3">
            {deal.client_name}
          </p>

          <p className="font-inter text-xs text-ink-muted mb-1">VEHICLE</p>
          <p className="font-inter text-sm text-ink mb-3">{carLabel}</p>

          <div className="bg-ink rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-inter text-xs text-white/70">Total</span>
              <span className="font-inter text-lg font-semibold text-gold tabular-nums">
                {formatUSD(deal.total_usd)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-inter text-[10px] text-white/50">NGN</span>
              <span className="font-inter text-xs text-white/80 tabular-nums">
                {formatNGN(deal.total_ngn)}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          {[
            { label: 'Created', value: formatDate(deal.created_at) },
            { label: 'Valid until', value: formatDate(expiryDate.toISOString()) },
            { label: 'Exchange rate', value: `₦${deal.exchange_rate.toLocaleString()}/$` },
            { label: 'Extras', value: `${(deal.extras as []).length} items` },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-4 py-3 ${
                i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''
              }`}
            >
              <span className="font-inter text-sm text-ink-muted">{row.label}</span>
              <span className="font-inter text-sm font-medium text-ink">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleDownload}
            loading={downloading}
            disabled={!settings}
            className="w-full"
          >
            <Download size={16} />
            {downloading ? 'Preparing PDF…' : 'Download Proforma PDF'}
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>

        {/* Preview */}
        {showPreview && settings && (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mt-2">
            <div className="w-full" style={{ height: '600px' }}>
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <ProformaPDF deal={deal} settings={settings} />
              </PDFViewer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
