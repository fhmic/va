import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function ProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [{ data: goals }, { data: totalMessagesSnapshot }, { data: streakSnapshot }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("progress_snapshots")
      .select("metric_value")
      .eq("user_id", user.id)
      .eq("metric_key", "total_messages")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("progress_snapshots")
      .select("metric_value")
      .eq("user_id", user.id)
      .eq("metric_key", "day_streak")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Your progress</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Day streak</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {streakSnapshot?.metric_value ?? 0}
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Messages sent</h2>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {totalMessagesSnapshot?.metric_value ?? 0}
          </p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Goals</h2>
        {goals && goals.length > 0 ? (
          <ul className="space-y-2">
            {goals.map((goal) => (
              <li key={goal.id}>
                <Card className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-900">{goal.title}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs capitalize text-slate-600">
                    {goal.status}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">
            No goals yet. Progress is tracked automatically from your mentor conversations —
            metric-only for now; assessment-based scoring arrives in a later phase.
          </p>
        )}
      </div>
    </div>
  );
}
