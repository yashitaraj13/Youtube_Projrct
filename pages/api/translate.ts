import type { NextApiRequest, NextApiResponse } from "next";

// Language code map for MyMemory free translation API
const langCodes: Record<string, string> = {
  Hindi: "hi",
  Tamil: "ta",
  Kannada: "kn",
  English: "en",
  Telugu: "te",
  Malayalam: "ml"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, language } = req.body as { text: string; language: string };

  if (!text || !language) {
    return res.status(400).json({ error: "Missing text or language" });
  }

  if (language === "English") {
    return res.status(200).json({ translation: text });
  }

  const targetLang = langCodes[language];
  if (!targetLang) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    // MyMemory is a free translation API — no key required for modest usage
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `en|${targetLang}`);

    const response = await fetch(url.toString());
    const data = await response.json() as {
      responseStatus: number;
      responseData: { translatedText: string };
    };

    if (data.responseStatus !== 200) {
      throw new Error("Translation API returned non-200 status");
    }

    return res.status(200).json({ translation: data.responseData.translatedText });
  } catch {
    // Fallback: return the original text with a suffix so the UI still shows something
    return res.status(200).json({
      translation: `${text} [${language}]`,
      fallback: true
    });
  }
}
