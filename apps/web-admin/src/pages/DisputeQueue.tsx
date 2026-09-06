import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listDisputes, resolveDispute } from '@/api/admin'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { DisputeStatusBadge } from '@/components/StatusBadge'
import { IconFlag, IconCheckCircle, IconX } from '@/components/ui/Icon'
import { formatDateTime, formatRupees } from '@/lib/format'
import type { Dispute, DisputeStatus } from '@/types'

const REASON_LABEL: Record<Dispute['reason'], string> = {
  ITEM_NOT_AVAILABLE_ON_ARRIVAL: 'Item not available on arrival',
  PRICE_MISMATCH: 'Price mismatch',
  QUALITY_ISSUE: 'Quality issue',
  SHOP_CLOSED: 'Shop closed',
  OTHER: 'Other',
}

function ResolveRow({ dispute, onDone }: { dispute: Dispute; onDone: () => void }) {
  const [note, setNote] = useState('')
  const [action, setAction] = useState<'RESOLVED' | 'REJECTED' | null>(null)
  const mutation = useMutation({
    mutationFn: (status: 'RESOLVED' | 'REJECTED') => resolveDispute(dispute.id, status, note.trim() || `Marked ${status.toLowerCase()} by admin.`),
    onSuccess: onDone,
  })

  return (
    <div className="flex flex-col gap-2 border-t border-brand-50 bg-brand-50/30 px-5 py-4">
      <label className="text-xs font-medium text-ink/60">
        Admin note (required to resolve or reject)
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="e.g. Refunded via cash on next visit; shop confirmed stock error."
          className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={!note.trim()}
          loading={mutation.isPending && action === 'RESOLVED'}
          onClick={() => { setAction('RESOLVED'); mutation.mutate('RESOLVED') }}
        >
          <IconCheckCircle size={14} /> Resolve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!note.trim()}
          loading={mutation.isPending && action === 'REJECTED'}
          onClick={() => { setAction('REJECTED'); mutation.mutate('REJECTED') }}
        >
          <IconX size={14} /> Reject
        </Button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-rose-600">{mutation.error instanceof Error ? mutation.error.message : 'Could not resolve this dispute.'}</p>
      )}
    </div>
  )
}

function DisputeCard({ dispute, onResolved }: { dispute: Dispute; onResolved: () => void }) {
  const [expanded, setExpanded] = useState(dispute.status === 'OPEN')
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <DisputeStatusBadge status={dispute.status} />
            <span className="text-xs font-semibold text-ink/70">{REASON_LABEL[dispute.reason]}</span>
            <span className="text-xs text-ink/40">Order {dispute.order.orderNumber}</span>
          </div>
          <p className="text-sm text-ink/80">{dispute.description}</p>
          <p className="mt-1 text-xs text-ink/45">
            Raised {formatDateTime(dispute.createdAt)} · order total {formatRupees(dispute.order.total)}
          </p>
          {dispute.status !== 'OPEN' && dispute.adminNote && (
            <p className="mt-2 rounded-lg bg-brand-50/60 px-3 py-2 text-xs text-ink/70">
              <span className="font-semibold text-ink/80">Admin note: </span>{dispute.adminNote}
            </p>
          )}
        </div>
      </button>
      {expanded && dispute.status === 'OPEN' && <ResolveRow dispute={dispute} onDone={onResolved} />}
    </Card>
  )
}

export default function DisputeQueue() {
  const [filter, setFilter] = useState<DisputeStatus | 'ALL'>('OPEN')
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['disputes', filter],
    queryFn: () => listDisputes(filter === 'ALL' ? undefined : filter),
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['disputes'] })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Dispute queue</h1>
        <p className="mt-1 text-sm text-ink/55">Resolve or reject customer disputes with an admin note. Live against the API.</p>
      </div>

      <div className="flex gap-2">
        {(['OPEN', 'RESOLVED', 'REJECTED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              filter === f ? 'bg-brand text-white' : 'bg-white text-ink/60 border border-brand-100 hover:bg-brand-50'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {query.isLoading && (
        <Card><TableSkeleton rows={3} cols={1} /></Card>
      )}

      {query.isError && (
        <Card><ErrorState description={query.error instanceof Error ? query.error.message : undefined} onRetry={() => query.refetch()} /></Card>
      )}

      {query.isSuccess && query.data.length === 0 && (
        <Card>
          <EmptyState
            icon={<IconFlag size={24} />}
            title={filter === 'OPEN' ? 'No open disputes' : 'No disputes here'}
            description="Nothing matches this filter right now."
          />
        </Card>
      )}

      {query.isSuccess && query.data.length > 0 && (
        <div className="flex flex-col gap-3">
          {query.data.map((d) => (
            <DisputeCard key={d.id} dispute={d} onResolved={refresh} />
          ))}
        </div>
      )}
    </div>
  )
}
