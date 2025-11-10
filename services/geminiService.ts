
import { GoogleGenAI, Type } from "@google/genai";
import type { OcrResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder check. The execution environment is expected to have the API_KEY.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        betNumber: {
          type: Type.STRING,
          description: 'The number played, e.g., "123" or "45-67".',
        },
        straightAmount: {
          type: Type.NUMBER,
          description: 'The amount for a "straight" bet. Return null if not present.',
        },
        boxAmount: {
          type: Type.NUMBER,
          description: 'The amount for a "box" bet. Return null if not present.',
        },
        comboAmount: {
          type: Type.NUMBER,
          description: 'The amount for a "combo" bet. Return null if not present.',
        },
      },
      required: ["betNumber", "straightAmount", "boxAmount", "comboAmount"],
    },
};

export const interpretTicketImage = async (base64Image: string): Promise<OcrResult[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image,
                        },
                    },
                    {
                        text: `
                            Analyze the provided lottery ticket image.
                            Extract all individual plays. For each play, identify the bet number, straight amount, box amount, and combo amount.
                            - The "bet number" is the main number being played. It can be 2-4 digits, or two 2-digit numbers separated by a dash for 'pale' bets.
                            - "straightAmount", "boxAmount", and "comboAmount" are the dollar values for each type of bet.
                            - If a specific amount (straight, box, or combo) is not present for a play, its value must be null.
                            Return the result as a JSON array matching the provided schema. Do not return any text outside of the JSON array.
                        `,
                    },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);

        if (!Array.isArray(parsedResult)) {
            throw new Error("AI response was not a valid array.");
        }
        
        // Further validation can be added here if needed
        return parsedResult as OcrResult[];

    } catch (error) {
        console.error("Error interpreting ticket with Gemini:", error);
        throw new Error("The AI failed to analyze the ticket. Please try again with a clearer image.");
    }
};
