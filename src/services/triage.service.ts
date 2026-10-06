export type TriageResult = {
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignedTeam: string;
  confidence: number;
  reasons: string[];
};

const rules = [
  {
    category: "SECURITY",
    team: "Security Operations",
    terms: ["breach", "fraud", "stolen", "unauthorized", "phishing", "compromised"]
  },
  {
    category: "ACTIVATION",
    team: "Technical Support",
    terms: ["activate", "activation", "sim", "esim", "provision"]
  },
  {
    category: "BILLING",
    team: "Billing Operations",
    terms: ["payment", "charged", "invoice", "refund", "billing"]
  },
  {
    category: "CONNECTIVITY",
    team: "Network Operations",
    terms: ["network", "signal", "no service", "data", "roaming", "connectivity"]
  }
];

export function triageTicket(subject: string, description: string): TriageResult {
  const text = `${subject} ${description}`.toLowerCase();

  const scored = rules
    .map(rule => ({
      ...rule,
      score: rule.terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const category = best?.score > 0 ? best.category : "GENERAL_SUPPORT";
  const assignedTeam = best?.score > 0 ? best.team : "Customer Support";

  const criticalTerms = ["breach", "stolen", "compromised", "outage", "emergency"];
  const highTerms = ["failed", "cannot", "blocked", "urgent", "refund"];
  const lowTerms = ["question", "information", "how to", "inquiry"];

  let priority: TriageResult["priority"] = "MEDIUM";
  if (criticalTerms.some(term => text.includes(term))) priority = "CRITICAL";
  else if (highTerms.some(term => text.includes(term))) priority = "HIGH";
  else if (lowTerms.some(term => text.includes(term))) priority = "LOW";

  const matchCount = best?.score ?? 0;
  const confidence = Number(Math.min(0.98, matchCount > 0 ? 0.72 + matchCount * 0.08 : 0.55).toFixed(2));

  return {
    category,
    priority,
    assignedTeam,
    confidence,
    reasons: [
      matchCount > 0 ? `Matched ${matchCount} category keyword(s)` : "No specialist category matched",
      `Priority inferred from ticket language: ${priority}`
    ]
  };
}
