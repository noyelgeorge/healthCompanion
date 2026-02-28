import { getApiKey } from "../lib/ai";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export interface ScannedMedicine {
    name: string;
    notes?: string;
    time: string; // HH:mm format
    confidence: 'high' | 'low';
    alternatives: string[];
    quantity?: number;       // Fix 5: pills prescribed
    frequencyPerDay?: number; // Fix 5: doses per day
}

// Fix 4: Medicine detail overview returned by AI
export interface MedicineOverview {
    ingredients: string;
    purpose: string;
    precautions: string;
    sideEffects: string;
}

export async function analyzeMedicineImage(file: File): Promise<ScannedMedicine[]> {
    const apiKey = getApiKey();

    if (!apiKey) throw new Error("No API key found. Please configure it in your Profile.");

    const base64Image = await fileToBase64(file);
    const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        // Fix 5: added quantity and frequencyPerDay to the prompt
                        text: `ACT AS A PHARMACIST. 
                                TASK: Identify ALL medications in the provided prescription, medicine list image, or PDF document.
                                EXTRACT: 
                                1. name: Brand or generic name.
                                2. notes: Brief dosage/instruction (e.g., '1 tab after food').
                                3. time: Suggest a logical daily time in 24h format (e.g., '09:00', '14:00', '21:00') based on common practices (morning/afternoon/night) or explicit instructions.
                                4. quantity: Total number of pills/tablets prescribed (integer). Extract from e.g. "Qty: 30", "#60", "30 tablets". If not found, omit or set null.
                                5. frequencyPerDay: Number of doses per day (integer). Extract from e.g. "twice daily" → 2, "TID" → 3, "once daily" → 1. If unclear, omit or set null.
                                
                                Return ONLY a JSON array:
                                [
                                  {
                                    "name": "string",
                                    "notes": "string",
                                    "time": "HH:mm",
                                    "confidence": "high" | "low",
                                    "alternatives": ["string"],
                                    "quantity": number | null,
                                    "frequencyPerDay": number | null
                                  }
                                ]`
                    },
                    {
                        inline_data: { mime_type: mimeType, data: base64Image }
                    }
                ]
            }]
        })
    });

    if (!response.ok) throw new Error("AI analysis failed");
    const result = await response.json();
    const content = result.candidates[0].content.parts[0].text;

    // Safe JSON Parsing Logic
    const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0];
    if (!jsonMatch) {
        console.error("No JSON array found in AI response:", content);
        return [];
    }

    try {
        const data = JSON.parse(jsonMatch.trim());
        return (data || []).map((m: Record<string, unknown>) => ({
            name: (m.name as string) || "Unknown Medicine",
            notes: (m.notes as string) || "",
            time: (m.time as string) || "09:00",
            confidence: (m.confidence as 'high' | 'low') || "low",
            alternatives: (m.alternatives as string[]) || [],
            quantity: typeof m.quantity === 'number' ? m.quantity : undefined,
            frequencyPerDay: typeof m.frequencyPerDay === 'number' ? m.frequencyPerDay : undefined,
        }));
    } catch (parseError) {
        console.error("Failed to parse AI JSON:", parseError, content);
        throw new Error("Medicine scan data was corrupted. Please try again.");
    }
}

// Fix 4: Fetch a brief AI overview of a medicine's details
export async function fetchMedicineOverview(name: string): Promise<MedicineOverview> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API key found. Please configure it in your Profile.");

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a clinical pharmacist assistant. Provide a concise patient-friendly overview of the medicine: "${name}".
                    
Return ONLY a JSON object:
{
  "ingredients": "Active compound(s) and drug class in 1-2 sentences",
  "purpose": "What this medicine treats / its main indications in 1-2 sentences",
  "precautions": "Key warnings, contraindications, or things to avoid in 1-2 sentences",
  "sideEffects": "Most common side effects in 1-2 sentences"
}`
                }]
            }]
        })
    });

    if (!response.ok) throw new Error("AI overview fetch failed");
    const result = await response.json();
    const content: string = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Robust JSON extraction
    const jsonMatch = content.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonMatch) throw new Error("Could not parse medicine overview from AI");

    const data = JSON.parse(jsonMatch.trim());
    return {
        ingredients: data.ingredients || '',
        purpose: data.purpose || '',
        precautions: data.precautions || '',
        sideEffects: data.sideEffects || '',
    };
}
