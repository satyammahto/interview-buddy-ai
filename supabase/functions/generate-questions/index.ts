import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { skills, role, mode, difficulty, experience } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modeInstructions: Record<string, string> = {
      technical: "Focus on technical questions: coding, data structures, algorithms, system design, and technical problem-solving relevant to the role.",
      behavioral: "Focus on behavioral questions using the STAR method: teamwork, leadership, conflict resolution, and past experiences.",
      hr: "Focus on HR questions: culture fit, salary expectations, career goals, strengths/weaknesses, and situational judgment.",
      stress: "Focus on stress interview questions: rapid-fire, challenging scenarios, pressure situations, and unexpected curveballs.",
    };

    const prompt = `Generate exactly 7 interview questions for this candidate:

Role: ${role}
Difficulty: ${difficulty}
Skills: ${(skills || []).join(", ") || "general"}
Experience: ${experience}
Mode: ${mode}

${modeInstructions[mode] || modeInstructions.technical}

Return a JSON object with a "questions" array. Each question should have:
- id (number, 1-7)
- text (the question string)
- category (short label like "System Design", "Teamwork", etc.)

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
          { role: "system", content: "You are an expert interviewer. Generate thoughtful, role-appropriate interview questions. Always return valid JSON." },
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
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
