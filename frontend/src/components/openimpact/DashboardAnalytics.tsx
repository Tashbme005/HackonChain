import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAmount } from "@/lib/openimpact/store";
import {
  isFullyAccounted,
  type Donation,
  type DonationStatus,
  type Organisation,
  type Recipient,
} from "@/lib/openimpact/types";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<DonationStatus, string> = {
  pending: "#D98F3E",
  received: "#5B8FA8",
  verified: "#1E8F6F",
  flagged: "#C1443C",
};

const STATUS_LABEL_SHORT: Record<DonationStatus, string> = {
  pending: "Sent",
  received: "Received",
  verified: "Verified",
  flagged: "Flagged",
};

function monthKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function givingByMonth(donations: Donation[]) {
  const map = new Map<string, { month: string; amount: number; count: number; sort: number }>();
  for (const d of donations) {
    const key = monthKey(d.timestamp);
    const sort = new Date(d.timestamp).getTime() || 0;
    const cur = map.get(key) ?? { month: key, amount: 0, count: 0, sort };
    cur.amount += d.amount;
    cur.count += 1;
    cur.sort = Math.min(cur.sort, sort);
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.sort - b.sort);
}

function statusBreakdown(donations: Donation[]) {
  const counts: Record<DonationStatus, number> = {
    pending: 0,
    received: 0,
    verified: 0,
    flagged: 0,
  };
  for (const d of donations) counts[d.status] += 1;
  return (Object.keys(counts) as DonationStatus[])
    .map((status) => ({
      status,
      label: STATUS_LABEL_SHORT[status],
      value: counts[status],
      fill: STATUS_COLOR[status],
    }))
    .filter((r) => r.value > 0);
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "data-mono mt-2 text-2xl",
          accent && "text-verified",
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

const amountConfig = {
  amount: { label: "Amount", color: "#1E8F6F" },
} satisfies ChartConfig;

const statusConfig = {
  value: { label: "Donations" },
} satisfies ChartConfig;

export function DonorAnalytics({
  donations,
  getOrg,
}: {
  donations: Donation[];
  getOrg: (id?: string) => Organisation | undefined;
}) {
  const total = donations.reduce((s, d) => s + d.amount, 0);
  const verified = donations.filter((d) => d.status === "verified").length;
  const withProof = donations.filter((d) => d.proof).length;
  const accounted = donations.filter((d) => isFullyAccounted(d)).length;
  const byMonth = givingByMonth(donations);
  const byStatus = statusBreakdown(donations);

  const byOrgMap = new Map<string, number>();
  for (const d of donations) {
    const name = getOrg(d.orgId)?.name ?? "Other";
    byOrgMap.set(name, (byOrgMap.get(name) ?? 0) + d.amount);
  }
  const byOrg = [...byOrgMap.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const proofRate = donations.length
    ? Math.round((withProof / donations.length) * 100)
    : 0;
  const accountedRate = donations.length
    ? Math.round((accounted / donations.length) * 100)
    : 0;

  if (donations.length === 0) {
    return (
      <p className="border border-dashed border-input p-10 text-center text-sm text-muted-foreground">
        No donations yet. Analytics appear once you start giving.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        How your giving is flowing: totals, status mix, proof rates, and where
        the money went.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total given" value={formatAmount(total, "USDC")} />
        <Metric
          label="Verified receipts"
          value={`${verified} / ${donations.length}`}
          accent
        />
        <Metric
          label="Proof of use rate"
          value={`${proofRate}%`}
          hint={`${withProof} with recipient proof`}
        />
        <Metric
          label="Fully accounted"
          value={`${accountedRate}%`}
          hint={`${accounted} with proof and publication`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-medium text-ink">Giving by month</p>
          <ChartContainer config={amountConfig} className="mt-3 aspect-[16/9] w-full">
            <BarChart data={byMonth} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-medium text-ink">Receipt status</p>
          <ChartContainer config={statusConfig} className="mt-3 aspect-[16/9] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {byStatus.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {byStatus.map((s) => (
              <li key={s.status} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: s.fill }}
                />
                {s.label} · {s.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium text-ink">Amount by organisation</p>
        <ChartContainer config={amountConfig} className="mt-3 aspect-[21/9] w-full">
          <BarChart
            data={byOrg}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

export function OrganisationAnalytics({
  donations,
  getRecipient,
  orgId,
  score,
  proofRate,
  pubRate,
}: {
  donations: Donation[];
  getRecipient: (id: string) => Recipient | undefined;
  orgId: string;
  score: number;
  proofRate: number;
  pubRate: number;
}) {
  const rows = donations.filter((d) => d.orgId === orgId);
  const incoming = rows.reduce((s, d) => s + d.amount, 0);
  const disbursed = rows
    .filter((d) => d.status !== "pending")
    .reduce((s, d) => s + d.amount, 0);
  const accounted = rows.filter((d) => isFullyAccounted(d)).length;
  const byMonth = givingByMonth(rows);
  const byStatus = statusBreakdown(rows);

  const byRecipientMap = new Map<string, number>();
  for (const d of rows) {
    const name = getRecipient(d.recipientId)?.pseudonym ?? "Unclaimed";
    byRecipientMap.set(name, (byRecipientMap.get(name) ?? 0) + d.amount);
  }
  const byRecipient = [...byRecipientMap.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const flowConfig = {
    incoming: { label: "In", color: "#1E8F6F" },
    disbursed: { label: "Out", color: "#D98F3E" },
  } satisfies ChartConfig;

  const flow = [
    { label: "Funds in", value: incoming, fill: "#1E8F6F" },
    { label: "Disbursed", value: disbursed, fill: "#D98F3E" },
    {
      label: "Holding",
      value: Math.max(0, incoming - disbursed),
      fill: "#5B8FA8",
    },
  ];

  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-input p-10 text-center text-sm text-muted-foreground">
        No donations yet. Analytics appear once donors start giving.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Operational view of money in, money out, accountability rates, and
        where funds were routed.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Funds in" value={formatAmount(incoming, "USDC")} />
        <Metric label="Disbursed" value={formatAmount(disbursed, "USDC")} />
        <Metric
          label="Trust score"
          value={`${score}%`}
          accent
          hint={`${proofRate}% proof · ${pubRate}% published`}
        />
        <Metric
          label="Fully accounted"
          value={`${accounted} / ${rows.length}`}
          hint="Proof plus publication"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-medium text-ink">Volume by month</p>
          <ChartContainer config={amountConfig} className="mt-3 aspect-[16/9] w-full">
            <BarChart data={byMonth} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-medium text-ink">Donation status</p>
          <ChartContainer config={statusConfig} className="mt-3 aspect-[16/9] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
              >
                {byStatus.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {byStatus.map((s) => (
              <li key={s.status} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: s.fill }}
                />
                {s.label} · {s.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-medium text-ink">Fund position</p>
          <ChartContainer config={flowConfig} className="mt-3 aspect-[16/9] w-full">
            <BarChart data={flow} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={4}>
                {flow.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="border border-border bg-card p-4 sm:p-5">
          <p className="text-sm font-medium text-ink">Amount by recipient</p>
          <ChartContainer config={amountConfig} className="mt-3 aspect-[16/9] w-full">
            <BarChart
              data={byRecipient}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
