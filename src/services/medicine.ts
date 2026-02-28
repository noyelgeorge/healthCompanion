import { getApiKey } from "../lib/ai";
import { extractTextFromImage } from "./ocr";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const apiCache = new Map<string, any[]>();

export async function searchMedicine(query: string) {
    if (!query || query.length < 3) return [];

    // Caching logic
    if (apiCache.has(query)) {
        return apiCache.get(query)!;
    }

    try {
        // Targeted FDA API query as requested
        const response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${query}"&limit=10`);

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const results = (data.results || []).map((r: any) => ({
            name: r.openfda?.brand_name?.[0] || r.openfda?.generic_name?.[0] || "Unknown Medicine",
            purpose: r.purpose?.[0] || r.indications_and_usage?.[0] || "General medication",
            usage: r.dosage_and_administration?.[0] || ""
        }));

        // If results are empty, try searching by generic name as fallback
        if (results.length === 0) {
            const fallbackResponse = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${query}"&limit=10`);
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                results.push(...(fallbackData.results || []).map((r: any) => ({
                    name: r.openfda?.brand_name?.[0] || r.openfda?.generic_name?.[0] || "Unknown Medicine",
                    purpose: r.purpose?.[0] || r.indications_and_usage?.[0] || "General medication",
                    usage: r.dosage_and_administration?.[0] || ""
                })));
            }
        }

        apiCache.set(query, results);
        return results;
    } catch (e) {
        console.error("Medicine search failed:", e);
        return [];
    }
}

export interface ScannedMedicine {
    name: string;
    notes?: string;
    time: string; // HH:mm format
    confidence: 'high' | 'low';
    alternatives: string[];
}

/**
 * Combined function to scan an image and search for matching food/medicine.
 */
export async function scanAndSearchFood(file: File) {
    try {
        const scannedText = await extractTextFromImage(file);

        // Split text into words and filter for potential brand names (at least 3 chars)
        const queries = scannedText
            .split(/\W+/)
            .filter(word => word.length >= 3)
            .slice(0, 5); // Limit queries for performance

        const allResults = await Promise.all(
            queries.map(q => searchMedicine(q))
        );

        // Flatten and deduplicate results by name
        const medicineResults = Array.from(
            new Map(allResults.flat().map(item => [item.name, item])).values()
        );

        return {
            scannedText,
            medicineResults
        };
    } catch (error) {
        console.error("Scan and search failed:", error);
        throw error;
    }
}

export async function analyzeMedicineImage(file: File): Promise<ScannedMedicine[]> {
    const apiKey = getApiKey();

    if (!apiKey) throw new Error("No API key found. Please configure it in your Profile.");

    const base64Image = await fileToBase64(file);
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    {
                        text: `ACT AS A PHARMACIST. 
                               TASK: Identify ALL medications in the provided prescription or medicine list image.
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
                        inline_data: { mime_type: file.type, data: base64Image }
                    }
                ]
            }]
        })
    });

    if (!response.ok) throw new Error("AI analysis failed");
    const result = await response.json();
    const content = result.candidates[0].content.parts[0].text;

    // Safe JSON Parsing Logic
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        console.error("No JSON array found in AI response:", content);
        return [];
    }

    try {
        const data = JSON.parse(jsonMatch[0].trim());
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
