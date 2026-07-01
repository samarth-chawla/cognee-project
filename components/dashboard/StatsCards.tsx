import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Stat {
  label: string;
  value: string | number;
}

/** Grid of summary stats for the dashboard. */
export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-500">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
