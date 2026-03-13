import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, answer, mode, role, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are evaluating a ${mode} interview answer for a ${role} position.

Question: "${question}"
Candidate's Answer: "${answer}"
${context ? `Conversation context:\n${context}` : ""}

Score the answer on these 5 dimensions (each 1-10):
1. technical_knowledge - accuracy, depth, correctness
2. communication - clarity, structure, articulation
3. problem_solving - approach, logic, creativity
4. confidence - tone, pace, filler word usage
5. relevance - how well the answer fits the question

Also provide:
- feedback: 2-3 sentences of constructive feedback
- follow_up: an optional follow-up question if the answer was interesting or incomplete (or null)

Return a JSON object with:
{
  "scores": { "technical_knowledge": N, "communication": N, "problem_solving": N, "confidence": N, "relevance": N },
  "feedback": "...",
  "follow_up": "..." or null
}

Return ONLY the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert interview evaluator. Be fair but constructive. Always return valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      scores: { technical_knowledge: 5, communication: 5, problem_solving: 5, confidence: 5, relevance: 5 },
      feedback: "Unable to evaluate.",
      follow_up: null,
    };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-answer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
