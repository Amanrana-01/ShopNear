import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getActiveShopsNearby, listDisputes } from '@/api/admin'
import { Card, CardHeader } from '@/components/ui/Card'
import { CardGridSkeleton, ChartSkeleton } from '@/components/ui/Skeleton'
import { NotAvailable, ErrorState } from '@/components/ui/EmptyState'
import { IconStore, IconFlag, IconCheckCircle, IconInfo } from '@/components/ui/Icon'

const ANCHOR = { lat: 23.0365, lng: 72.5611, radius: 5000 }
const BRAND_SCALE = ['#7B2FBE', '#A56EE6', '#2DD4BF', '#F59E0B', '#0D9488', '#571F85', '#BE9AF0', '#EAE0FC', '#3D1270']

function StatCard({ label, value, Icon, tone }: { label: string; value: string; Icon: (p: { size?: number; className?: string }) => JSX.Element; tone: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/45">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tone}`}><Icon size={16} /></span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
    </Card>
  )
}

const ANALYTICS_GAPS = [
  {
    title: 'Orders per day',
    description: 'Needs an order-volume time series across every shop.',
    endpoints: ['GET /api/admin/analytics/orders-per-day'],
  },
  {
    title: 'Confirmation rate per shop',
    description: 'Needs every shop\'s order outcomes (confirmed vs rejected vs expired) aggregated by shop.',
    endpoints: ['GET /api/admin/analytics/confirmation-rate-per-shop'],
  },
  {
    title: 'Median merchant response time',
    description: 'Needs createdAt → confirmedAt/rejectedAt deltas across all orders.',
    endpoints: ['GET /api/admin/analytics/merchant-response-time'],
  },
  {
    title: 'Top zero-result searches',
    description: 'The unmet-demand report. SearchLog rows exist (~400 seeded, ~30 zero-result, clustered on a few queries) but nothing exposes them.',
    endpoints: ['GET /api/admin/analytics/zero-result-searches'],
  },
  {
    title: 'Availability accuracy rate',
    description: 'Needs AvailabilityEvent rows aggregated (e.g. how often a "confirmed" item was actually available at pickup).',
    endpoints: ['GET /api/admin/analytics/availability-accuracy'],
  },
]

export default function Dashboard() {
  const shopsQuery = useQuery({
    queryKey: ['dashboard-shops'],
    queryFn: () => getActiveShopsNearby(ANCHOR.lat, ANCHOR.lng, ANCHOR.radius),
  })
  const disputesQuery = useQuery({ queryKey: ['dashboard-disputes'], queryFn: () => listDisputes() })

  const shopsByType = useMemo(() => {
    if (!shopsQuery.data) return []
    const counts = new Map<string, number>()
    for (const s of shopsQuery.data) counts.set(s.type, (counts.get(s.type) ?? 0) + 1)
    return [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
  }, [shopsQuery.data])

  const disputesByReason = useMemo(() => {
    if (!disputesQuery.data) return []
    const counts = new Map<string, number>()
    for (const d of disputesQuery.data) counts.set(d.reason, (counts.get(d.reason) ?? 0) + 1)
    return [...counts.entries()].map(([reason, count]) => ({ reason: reason.replaceAll('_', ' ').toLowerCase(), count }))
  }, [disputesQuery.data])

  const openCount = disputesQuery.data?.filter((d) => d.status === 'OPEN').length ?? 0
  const resolvedCount = disputesQuery.data?.filter((d) => d.status !== 'OPEN').length ?? 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink/55">
          Everything below is either real live data from the API, or an honestly labelled gap — never invented numbers.
        </p>
      </div>

      {(shopsQuery.isLoading || disputesQuery.isLoading) && <CardGridSkeleton count={4} />}

      {shopsQuery.isSuccess && disputesQuery.isSuccess && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active shops (≤5 km)" value={String(shopsQuery.data.length)} Icon={IconStore} tone="bg-brand-50 text-brand-700" />
          <StatCard label="Shop types represented" value={String(shopsByType.length)} Icon={IconStore} tone="bg-teal-50 text-teal-700" />
          <StatCard label="Open disputes" value={String(openCount)} Icon={IconFlag} tone="bg-amber-50 text-amber-700" />
          <StatCard label="Resolved / rejected disputes" value={String(resolvedCount)} Icon={IconCheckCircle} tone="bg-gray-100 text-gray-600" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Active shops by type" description={`Live from GET /api/shops/nearby (radius ${ANCHOR.radius / 1000} km around the seed centre) — count of shops, y-axis.`} />
          {shopsQuery.isLoading && <ChartSkeleton />}
          {shopsQuery.isError && <ErrorState onRetry={() => shopsQuery.refetch()} />}
          {shopsQuery.isSuccess && shopsByType.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-ink/50">No active shops found near the seed centre.</div>
          )}
          {shopsQuery.isSuccess && shopsByType.length > 0 && (
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shopsByType} margin={{ left: 4, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE0FC" vertical={false} />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: 'Shops', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {shopsByType.map((_, i) => <Cell key={i} fill={BRAND_SCALE[i % BRAND_SCALE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Disputes by reason" description="Live from GET /api/admin/disputes — count of disputes, y-axis. Sample size is small (seed has 2 OPEN disputes); read as illustrative, not statistically significant." />
          {disputesQuery.isLoading && <ChartSkeleton />}
          {disputesQuery.isError && <ErrorState onRetry={() => disputesQuery.refetch()} />}
          {disputesQuery.isSuccess && disputesByReason.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-ink/50">No disputes recorded yet.</div>
          )}
          {disputesQuery.isSuccess && disputesByReason.length > 0 && (
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={disputesByReason} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE0FC" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: 'Disputes', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis type="category" dataKey="reason" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {disputesByReason.map((_, i) => <Cell key={i} fill={BRAND_SCALE[i % BRAND_SCALE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <IconInfo size={16} className="text-amber-600" />
          <h2 className="font-display text-base font-semibold text-ink">Required charts not yet buildable</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ANALYTICS_GAPS.map((gap) => (
            <Card key={gap.title}>
              <CardHeader title={gap.title} description={gap.description} />
              <NotAvailable title="Not yet available" description="" endpoints={gap.endpoints} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
