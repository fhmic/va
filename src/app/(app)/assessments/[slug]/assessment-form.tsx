"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";

interface Question {
  id: string;
  type: "likert" | "open";
  prompt: string;
  scale?: number;
}

export function AssessmentForm({ templateId, questions }: { templateId: string; questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ narrativeSummary: string } | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    const res = await fetch("/api/assessments/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, answers }),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Something went wrong. Please try again.");
      return;
    }

    const data = await res.json();
    setResult({ narrativeSummary: data.narrativeSummary });
  }

  if (result) {
    return (
      <Card className="space-y-3">
        <h2 className="font-medium text-slate-900">Your results</h2>
        <p className="text-sm text-slate-700">{result.narrativeSummary}</p>
        <Button variant="secondary" onClick={() => router.push("/progress")}>
          View on your progress page
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <FormAlert tone="error" message={error} /> : null}
      {questions.map((q) => (
        <Card key={q.id}>
          <p className="mb-3 text-sm font-medium text-slate-900">{q.prompt}</p>
          {q.type === "likert" ? (
            <div className="flex gap-2">
              {Array.from({ length: q.scale ?? 5 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
                  className={`h-10 w-10 rounded-lg border text-sm font-medium transition-colors ${
                    answers[q.id] === n
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none
                focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          )}
        </Card>
      ))}
      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={Object.keys(answers).length < questions.length}
        className="w-full"
      >
        Submit
      </Button>
    </div>
  );
}
