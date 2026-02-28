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
                        text: `ACT AS A PHARMACIST. 
                                TASK: Identify ALL medications in the provided prescription, medicine list image, or PDF document.
                                EXTRACT: 
                                1. name: Brand or generic name.
                                2. notes: Brief dosage/instruction (e.g., '1 tab after food').
                                3. time: Suggest a logical daily time in 24h format (e.g., '09:00', '14:00', '21:00') based on common practices (morning/afternoon/night) or explicit instructions.
                                
                                Return ONLY a JSON array:
                                [
                                  {
                                    "name": "string",
                                    "notes": "string",
                                    "time": "HH:mm",
                                    "confidence": "high" | "low",
                                    "alternatives": ["string"]
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

    // Safe JSON Parsing Logic as requested
    const jsonMatch = content.match(/\[[\s\S]*\]/)?.[0];
    if (!jsonMatch) {
        console.error("No JSON array found in AI response:", content);
        return [];
    }

    try {
        const data = JSON.parse(jsonMatch.trim());
        return (data || []).map((m: any) => ({
            name: m.name || "Unknown Medicine",
            notes: m.notes || "",
            time: m.time || "09:00",
            confidence: m.confidence || "low",
            alternatives: m.alternatives || []
        }));
    } catch (parseError) {
        console.error("Failed to parse AI JSON:", parseError, content);
        throw new Error("Medicine scan data was corrupted. Please try again.");
    }
}
