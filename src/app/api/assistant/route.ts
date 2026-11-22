import { buildUserPrompt, getTask, offlineTemplate, SYSTEM_PROMPT, type AssistantInput } from "@/lib/assistant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const rate = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (rate.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  rate.set(ip, arr);
  return arr.length > 10;
}

async function callGemini(key: string, user: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

async function callOpenAI(key: string, user: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "طلبات كثيرة خلال دقيقة واحدة، انتظري قليلاً ثم حاولي مجدداً." }, { status: 429 });

  const body = (await req.json().catch(() => null)) as Partial<AssistantInput> | null;
  const task = getTask(String(body?.task ?? ""));
  if (!task) return Response.json({ error: "نوع المساعدة غير صحيح" }, { status: 400 });
  const input: AssistantInput = {
    task: task.id,
    grade: String(body?.grade ?? "").trim().slice(0, 100),
    subject: String(body?.subject ?? "").trim().slice(0, 100),
    details: String(body?.details ?? "").trim().slice(0, 6000),
  };
  if (input.details.length < 5) return Response.json({ error: "اكتبي تفاصيل طلبك (5 أحرف على الأقل)" }, { status: 400 });

  const user = buildUserPrompt(task, input);
  const gemini = process.env.GEMINI_API_KEY;
  const openai = process.env.OPENAI_API_KEY;

  try {
    if (gemini) return Response.json({ content: await callGemini(gemini, user), provider: "gemini", section: task.section });
    if (openai) return Response.json({ content: await callOpenAI(openai, user), provider: "openai", section: task.section });
  } catch (err) {
    console.error("[assistant]", err);
    return Response.json({ content: offlineTemplate(task, input), provider: "offline", section: task.section, warning: "تعذر الاتصال بخدمة الذكاء الاصطناعي، فعرضنا قالباً منظّماً بدلاً منها." });
  }
  return Response.json({ content: offlineTemplate(task, input), provider: "offline", section: task.section, warning: "لم يُضبط مفتاح الذكاء الاصطناعي في الخادم، فعرضنا قالباً منظّماً للتعبئة يدوياً." });
}
