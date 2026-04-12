import { GoogleGenAI, Type } from "@google/genai";
import { ProductData } from '../types';

// Initialize the client with the environment API Key
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to retry API calls on rate limit errors (429/503)
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    let errorMessage = '';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.message) {
      errorMessage = String(error.message);
    } else if (error?.error?.message) {
      errorMessage = String(error.error.message);
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = String(error);
      }
    }

    const isQuotaExceeded = errorMessage.toLowerCase().includes('quota');
    
    if (isQuotaExceeded) {
      console.warn("Gemini API Quota Exceeded. Please check your billing details.");
      throw new Error("QUOTA_EXCEEDED");
    }

    // Check for rate limit or resource exhausted errors
    const isRateLimit = error?.status === 429 || 
                        error?.code === 429 || 
                        error?.error?.code === 429 ||
                        errorMessage.includes('429') || 
                        error?.status === 'RESOURCE_EXHAUSTED' ||
                        error?.error?.status === 'RESOURCE_EXHAUSTED' ||
                        errorMessage.includes('RESOURCE_EXHAUSTED');
                        
    const isServerOverload = error?.status === 503 || error?.code === 503 || error?.error?.code === 503;

    if (retries > 0 && (isRateLimit || isServerOverload)) {
      console.warn(`Gemini API rate limited/busy. Retrying in ${delay}ms...`);
      await wait(delay);
      // Exponential backoff
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Analyzes the product image and extracts listing details using Search Grounding.
 */
export const analyzeProductImage = async (base64Image: string, mimeType: string): Promise<ProductData> => {
  try {
    const response = await withRetry(async () => {
        return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
            {
                inlineData: {
                mimeType: mimeType,
                data: base64Image,
                },
            },
            {
                text: `Analyze this product image. 
                Generate a high-quality product listing tailored for the Indian market.
                
                Return a JSON object with:
                - title: The official or most common product name.
                - description: A detailed description (approx 50 words) including specs.
                - category: Specific product category.
                - price: The estimated market price in Indian Rupees (INR) (number only, no formatting).
                - currency: Always set this to "INR".
                - color: Primary color.
                - tags: 5 relevant search tags.
                - condition: Assess visual condition (default to 'New').
                `
            },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Official product title" },
                description: { type: Type.STRING, description: "Detailed description with specs" },
                category: { type: Type.STRING, description: "Specific product category" },
                price: { type: Type.NUMBER, description: "Estimated market price in INR" },
                currency: { type: Type.STRING, description: "Currency code, always 'INR'" },
                color: { type: Type.STRING, description: "Primary color name" },
                tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Search tags" 
                },
                condition: { 
                type: Type.STRING, 
                enum: ['New', 'Like New', 'Used', 'Refurbished'],
                description: "Product condition"
                }
            },
            required: ["title", "description", "category", "price", "currency", "color", "tags", "condition"]
            }
        }
        });
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text) as ProductData;

    // Extract Google Search Grounding Metadata (URLs)
    // @ts-ignore - groundingMetadata types might not be fully exposed in all SDK versions yet
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(chunks)) {
      const sources = chunks
        .map((c: any) => c.web?.uri)
        .filter((uri: string) => typeof uri === 'string');
      
      if (sources.length > 0) {
        // Deduplicate sources
        data.sources = [...new Set(sources)];
      }
    }

    return data;

  } catch (error: any) {
    if (error?.message === "QUOTA_EXCEEDED") {
      console.warn("Product Analysis Skipped: API Quota Exceeded.");
    } else {
      console.error("Gemini Analysis Error:", error);
    }
    // Return a fallback structure in case of severe error to prevent app crash
    return {
      title: "",
      description: "Could not analyze image. Please fill details manually.",
      category: "Uncategorized",
      price: 0,
      currency: "INR",
      color: "",
      tags: [],
      condition: "New"
    };
  }
};

/**
 * Enhances the product image by replacing background and improving quality.
 */
export const enhanceProductImage = async (base64Image: string, mimeType: string): Promise<string | null> => {
  try {
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
            {
                inlineData: {
                mimeType: mimeType,
                data: base64Image,
                },
            },
            {
                text: "Create a professional e-commerce product photography shot of this item. 1. Replace the background with a clean, seamless soft white or light gray studio background. 2. Enhance the lighting to be professional studio quality. 3. Ensure the product looks realistic, sharp, and high-resolution. 4. Maintain the product's original shape, text, logos, and key details exactly as they are, but present them in the best possible way."
            },
            ],
        },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return null;
    });
  } catch (error: any) {
    if (error?.message === "QUOTA_EXCEEDED") {
      console.warn("Image Enhancement Skipped: API Quota Exceeded.");
    } else {
      console.error("Image Enhancement Error:", error);
    }
    return null;
  }
};

/**
 * Generates additional angles/views of the product.
 */
export const generateProductVariations = async (base64Image: string, mimeType: string): Promise<string[]> => {
  const variations = [
    "Generate a realistic image of this exact product from a side view on a clean white background. Maintain all product details consistency.",
    "Show this product in a realistic lifestyle setting appropriate for its category (e.g. on a table, being held, or in use)."
  ];

  const results: string[] = [];

  // SEQUENTIAL execution to avoid rate limits (Promise.all causes concurrency spike)
  for (const prompt of variations) {
    try {
        const result = await withRetry(async () => {
            const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                {
                    inlineData: {
                    mimeType: mimeType,
                    data: base64Image,
                    },
                },
                {
                    text: prompt
                },
                ],
            },
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
            return null;
        });

        if (result) results.push(result);
    } catch (err: any) {
        if (err?.message === "QUOTA_EXCEEDED") {
            console.warn("Variation generation aborted: API Quota Exceeded.");
            break; // Abort further variations if quota is exceeded
        }
        console.error("Variation generation failed for prompt:", prompt, err);
        // We continue to the next variation even if one fails
    }
  }

  return results;
};