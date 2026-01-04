import { GoogleGenAI } from "@google/genai";
import { Ward, UserRole, AIAnalysisResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWardAnalysis = async (ward: Ward, role: UserRole): Promise<AIAnalysisResult> => {
  const ai = getClient();
  
  const fallbackResult: AIAnalysisResult = {
    recommendations: [
       {
        id: 'fallback-1',
        title: 'System Offline',
        description: 'AI services are currently unavailable.',
        type: 'advisory'
      }
    ],
    groundingUrls: [],
    trendAnalysis: "Historical data analysis unavailable.",
    sourceBreakdown: [],
    news: []
  };

  if (!ai) {
    return {
      ...fallbackResult,
      recommendations: [{
        id: 'key-missing',
        title: 'API Key Missing',
        description: 'Please add your Google GenAI API Key to use the AI analysis features.',
        type: 'advisory'
      }]
    };
  }

  const roleContext = role === UserRole.OFFICIAL 
    ? "You are advising a Municipal Authority. Focus on policy, enforcement, and mitigation." 
    : "You are advising a local resident. Focus on health, safety, and community action.";

  const prompt = `
    ${roleContext}
    Analyze the following pollution data for Ward: ${ward.name} (Lat: ${ward.location.lat}, Lng: ${ward.location.lng}).
    Current AQI: ${ward.aqi}.
    7-Day AQI Trend (Past to Present): [${ward.trend.join(', ')}].
    Main Source (Heuristic): ${ward.primarySource}.
    Secondary Source (Heuristic): ${ward.secondarySource}.
    Pollutants: PM2.5: ${ward.pollutants.pm25}, PM10: ${ward.pollutants.pm10}, NO2: ${ward.pollutants.no2}, SO2: ${ward.pollutants.so2}, O3: ${ward.pollutants.o3}.
    
    1. Provide 3 distinct, actionable recommendations.
    2. Analyze the 7-day trend history. Compare current levels with the 7-day average. Identify if pollution is increasing, decreasing, or fluctuating.
    3. Provide a detailed breakdown of probable pollution sources based on the ratio of pollutants. Estimate the percentage contribution of each source (must sum to 100%) and assign a confidence score.
    4. USE GOOGLE SEARCH to find the LATEST news (within the last 7 days) related to air pollution, smog alerts, OR government measures taken for tackling pollution in ${ward.name} or the larger city/region it belongs to. Summarize 3 key news items.

    Return pure JSON adhering to this schema ONLY, do not include markdown formatting:
    {
      "recommendations": [
        { "title": "string", "description": "string", "type": "urgent" | "advisory" | "policy" }
      ],
      "trendAnalysis": "string (A 2-3 sentence analysis of the historical trend)",
      "sourceBreakdown": [
        { "source": "string", "percentage": number, "confidence": "High" | "Medium" | "Low" }
      ],
      "news": [
        { "title": "string", "summary": "string", "timeAgo": "string (e.g. '2 hours ago', 'Yesterday')", "source": "string (Publisher Name, e.g. 'The Times of India', 'BBC')" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });

    let result: AIAnalysisResult = { recommendations: [], groundingUrls: [], trendAnalysis: '', sourceBreakdown: [], news: [] };

    // Extract Text Response
    if (response.text) {
      try {
        // Cleanup potential markdown blocks if the model adds them despite instructions
        const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        if (parsed.recommendations) {
          result.recommendations = parsed.recommendations.map((rec: any, index: number) => ({
            ...rec,
            id: `gen-${index}`
          }));
        }
        
        if (parsed.trendAnalysis) {
          result.trendAnalysis = parsed.trendAnalysis;
        }

        if (parsed.sourceBreakdown) {
          result.sourceBreakdown = parsed.sourceBreakdown;
        }

        if (parsed.news) {
          result.news = parsed.news;
        }

      } catch (e) {
        console.error("Failed to parse JSON response", e);
      }
    }

    // Extract Google Search Grounding Metadata
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.groundingChunks) {
      const urls = new Set<string>();
      
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
           if (!urls.has(chunk.web.uri)) {
             urls.add(chunk.web.uri);
             result.groundingUrls.push({ title: chunk.web.title, uri: chunk.web.uri });
           }
        }
      });
    }

    return result;

  } catch (error) {
    console.error("Error generating analysis:", error);
    return {
      ...fallbackResult,
      recommendations: [{
        id: 'err-1',
        title: 'Analysis Unavailable',
        description: 'AI service is temporarily unavailable. Please rely on standard protocols.',
        type: 'advisory'
      }]
    };
  }
};