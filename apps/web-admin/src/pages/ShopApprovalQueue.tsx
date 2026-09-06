import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listShopsForApproval, setShopStatus } from '@/api/admin'
import { EndpointNotAvailableError } from '@/api/client'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { NotAvailable, ErrorState, EmptyState } from '@/components/ui/EmptyState'
import { ShopStatusBadge } from '@/components/StatusBadge'
import { IconStore, IconCheckCircle, IconX } from '@/components/ui/Icon'
import { formatDate } from '@/lib/format'

/**
 * Approve/reject pending shops. Fully wired to `listShopsForApproval` /
 * `setShopStatus` (api/admin.ts) so this works the instant the API grows
 * `GET /api/admin/shops` + a status-change route — nothing in this
 * component needs to change. Until then it renders the honest
 * "not yet available" state below, naming exactly what's missing.
 *
 * Why nothing else can substitute: `GET /api/shops/nearby` filters
 * `status = 'ACTIVE'` at the SQL level (see shops.service.ts), so PENDING
 * and SUSPENDED shops are structurally invisible to it — there is no way
 * to enumerate them via any existing public or merchant route.
 */
export default function ShopApprovalQueue() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['admin-shops'], queryFn: listShopsForApproval, retry: false })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => setShopStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shops'] }),
  })

  const notAvailable = query.error instanceof EndpointNotAvailableError ? query.error : null

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">Shop approval queue</h1>
        <p className="mt-1 text-sm text-ink/55">Approve a pending shop to let it go live and start receiving orders, or suspend one that's misbehaving.</p>
      </div>

      <Card>
        <CardHeader title="Pending & suspended shops" description="Approving flips status to ACTIVE; the shop can then be found in nearby search and receive orders." />

        {query.isLoading && <TableSkeleton rows={3} cols={4} />}

        {query.isError && notAvailable && (
          <NotAvailable
            endpoints={notAvailable.endpoints}
            description="The API has no route to list shops by status (PENDING/SUSPENDED), and no route to change a shop's status as an admin. GET /api/shops/nearby exists but deliberately excludes non-ACTIVE shops, so they cannot be enumerated any other way. The seed data does contain two PENDING shops and one SUSPENDED shop — they just aren't reachable through any endpoint yet. The table, approve, and reject actions below are fully wired to the contract this page expects; they will work the moment the endpoint exists."
          />
        )}

        {query.isError && !notAvailable && (
          <ErrorState description={query.error instanceof Error ? query.error.message : undefined} onRetry={() => query.refetch()} />
        )}

        {query.isSuccess && query.data.length === 0 && (
          <EmptyState icon={<IconStore size={22} />} title="Nothing pending" description="Every shop is either active or has no pending action." />
        )}

        {query.isSuccess && query.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-50 text-xs uppercase tracking-wide text-ink/45">
                <tr>
                  <th className="px-5 py-3 font-medium">Shop</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((shop) => (
                  <tr key={shop.id} className="border-b border-brand-50 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-ink">{shop.name}</p>
                      <p className="text-xs text-ink/45">{shop.address}</p>
                    </td>
                    <td className="px-5 py-3 text-ink/70">{shop.type}</td>
                    <td className="px-5 py-3"><ShopStatusBadge status={shop.status} /></td>
                    <td className="px-5 py-3 text-ink/60">{formatDate(shop.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => mutation.mutate({ id: shop.id, status: 'ACTIVE' })} loading={mutation.isPending}>
                          <IconCheckCircle size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: shop.id, status: 'SUSPENDED' })} loading={mutation.isPending}>
                          <IconX size={14} /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
