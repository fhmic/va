import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, timezone")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
      <Card className="space-y-3">
        <div>
          <p className="text-sm text-slate-500">Name</p>
          <p className="font-medium text-slate-900">{profile?.display_name ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium text-slate-900">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Timezone</p>
          <p className="font-medium text-slate-900">{profile?.timezone}</p>
        </div>
      </Card>
      <p className="text-sm text-slate-400">
        Editable settings, communication DNA view, and data export arrive in a later phase.
      </p>
    </div>
  );
}
