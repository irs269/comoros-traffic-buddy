import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { image } = await req.json();

    if (!image || image === "data:," || image.length < 100) {
      return new Response(JSON.stringify({ error: "No valid image provided", plate: null, raw: "NO_IMAGE" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Use Lovable AI Gateway with a vision model to extract plate number
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a specialized license plate OCR system for the Comoros Islands. Your task is to extract license plate numbers from images with high accuracy.

Comoros license plates typically follow these formats:
- 3-4 digits followed by 2-3 letters and "KM" (e.g., "1234 ABC KM", "567 XYZ KM")
- May have variations in spacing and character order
- Characters are alphanumeric (A-Z, 0-9)

Instructions:
1. Focus ONLY on the license plate area
2. Extract ALL characters you can see, even if partial
3. Return ONLY the extracted plate text, nothing else
4. If you are uncertain or cannot read any characters, return exactly "NO_PLATE_DETECTED"
5. Clean up spaces but preserve the character order
6. Convert to uppercase

Examples of expected output: "1234 ABC KM", "567 XYZ KM", "NO_PLATE_DETECTED"`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image },
              },
              {
                type: "text",
                text: "Extract the license plate number from this image.",
              },
            ],
          },
        ],
        max_tokens: 30,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", errText);
      return new Response(JSON.stringify({ error: "OCR processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await response.json();
    const plateText = data.choices?.[0]?.message?.content?.trim() || "NO_PLATE_DETECTED";

    return new Response(
      JSON.stringify({
        plate: plateText === "NO_PLATE_DETECTED" ? null : plateText,
        raw: plateText,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
