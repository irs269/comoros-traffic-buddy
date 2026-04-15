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
            content: `You are a license plate OCR system for the Comoros Islands. Extract the license plate number from the image. 
Return ONLY the plate number text, nothing else. If no plate is detected, return exactly "NO_PLATE_DETECTED".
Comoros plates typically have numbers and letters like "123 ABC KM". Clean up and normalize the text.`,
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
        max_tokens: 50,
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
