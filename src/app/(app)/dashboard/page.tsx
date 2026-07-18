import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, plan, created_at")
    .eq("id", user.id)
    .single();

  const { data: assignment } = await supabase
    .from("user_mentor_assignments")
    .select("mentors(display_name, tagline)")
    .eq("user_id", user.id)
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: streakSnapshot } = await supabase
    .from("progress_snapshots")
    .select("metric_value")
    .eq("user_id", user.id)
    .eq("metric_key", "day_streak")
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Supabase's relational embed typing isn't fully resolved for this
  // hand-authored Database type; narrowed here rather than fighting it.
  const mentor = (assignment as any)?.mentors as { display_name: string; tagline: string } | undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mentor
            ? `${mentor.display_name} is ready when you are.`
            : "Your mentor will be matched to you when you start your first conversation."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Plan</h2>
          <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{profile?.plan}</p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Day streak</h2>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {streakSnapshot?.metric_value ?? 0} {streakSnapshot?.metric_value === 1 ? "day" : "days"}
          </p>
        </Card>
        <Card>
          <h2 className="text-sm font-medium text-slate-500">Mentor</h2>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {mentor?.display_name ?? "Not matched yet"}
          </p>
          {mentor?.tagline ? <p className="mt-1 text-xs text-slate-500">{mentor.tagline}</p> : null}
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/mentor">
          <Button>Talk to your mentor</Button>
        </Link>
        <Link href="/progress">
          <Button variant="secondary">View progress</Button>
        </Link>
      </div>
    </div>
  );
}
