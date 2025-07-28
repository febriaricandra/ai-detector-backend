const OpenAI = require('openai');
const crypto = require('crypto');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GPT_MAX_RETRIES = parseInt(process.env.GPT_MAX_RETRIES) || 2;
const GPT_TIMEOUT_DURATION = parseInt(process.env.GPT_TIMEOUT_DURATION) || 25000;
const GPT_CACHE_TTL = parseInt(process.env.GPT_CACHE_TTL) || 60 * 60 * 1000; // 1 hour
const GPT_MODEL = process.env.GPT_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  timeout: 30000 // Set timeout at client level
});

// Simple in-memory cache for small scale applications (50-100 users)
const analysisCache = new Map();
const CACHE_TTL = GPT_CACHE_TTL;

// Generate cache key based on text sample and parameters
const generateCacheKey = (text, prediction, confidence) => {
  const textSample = text.slice(0, 500); // First 500 characters
  const hash = crypto.createHash('sha256')
    .update(`${textSample}:${prediction}:${confidence.ai.toFixed(2)}:${confidence.human.toFixed(2)}`)
    .digest('hex');
  return hash;
};

// Clean expired cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of analysisCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(key);
    }
  }
};

// Sleep function for retry mechanism
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate fallback analysis for error cases
const generateFallbackAnalysis = () => {
  return JSON.stringify({
    linguistic_indicators: [{
      pattern: "analisis_tidak_tersedia",
      description: "Sistem sedang mengalami gangguan teknis",
      ai_likelihood: "tidak_diketahui",
      examples: []
    }],
    vocabulary_analysis: {
      complexity: "tidak dapat dianalisis",
      technical_terms: [],
      repetitive_phrases: [],
      sentence_structure: "analisis tidak tersedia saat ini"
    },
    writing_style: {
      formality: "tidak diketahui",
      flow: "tidak diketahui",
      coherence: "tidak diketahui",
      human_markers: [],
      ai_markers: []
    },
    conclusion: {
      primary_reason: "Analisis sementara tidak tersedia",
      confidence_explanation: "Sistem sedang mengalami gangguan teknis, silakan coba lagi dalam beberapa menit",
      recommendation: "Ulangi analisis dalam beberapa saat atau hubungi administrator jika masalah berlanjut"
    }
  });
};

exports.analyzeTextWithGPT = async (text, prediction, confidence, maxRetries = GPT_MAX_RETRIES) => {
  try {
    console.log('GPT Analysis - Starting with config:', {
      model: GPT_MODEL,
      maxRetries: maxRetries,
      timeout: GPT_TIMEOUT_DURATION,
      textLength: text.length
    });

    // Periodic cache cleanup (10% chance on each call)
    if (Math.random() < 0.1) cleanCache();

    // Check cache first
    const cacheKey = generateCacheKey(text, prediction, confidence);
    const cachedResult = analysisCache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
      console.log('GPT Analysis - Cache hit, returning cached result');
      return { analysis: cachedResult.data };
    }

    console.log('GPT Analysis - Cache miss, calling OpenAI API');

    const prompt = `
Analisis pola linguistik dari teks berikut dan berikan reasoning mengapa teks ini diprediksi sebagai "${prediction}" dengan confidence AI: ${confidence.ai.toFixed(3)} dan Human: ${confidence.human.toFixed(3)}.

Teks: "${text.slice(0, 1000)}${text.length > 1000 ? '...' : ''}"

Berikan analisis dalam format JSON dengan struktur berikut:
{
    "linguistic_indicators": [
        {
            "pattern": "nama_pola",
            "description": "deskripsi pola yang ditemukan",
            "ai_likelihood": "rendah/sedang/tinggi",
            "examples": ["contoh dari teks"]
        }
    ],
    "vocabulary_analysis": {
        "complexity": "rendah/sedang/tinggi",
        "technical_terms": ["istilah teknis yang ditemukan"],
        "repetitive_phrases": ["frasa yang berulang"],
        "sentence_structure": "deskripsi struktur kalimat"
    },
    "writing_style": {
        "formality": "formal/informal/campuran",
        "flow": "alami/kaku/berulang",
        "coherence": "baik/sedang/buruk",
        "human_markers": ["indikator penulisan manusia"],
        "ai_markers": ["indikator penulisan AI"]
    },
    "conclusion": {
        "primary_reason": "alasan utama prediksi",
        "confidence_explanation": "penjelasan tingkat confidence",
        "recommendation": "rekomendasi atau catatan tambahan"
    }
}

Fokus pada:
1. Pola struktur kalimat dan koherensi
2. Penggunaan vocabulary dan terminologi
3. Gaya penulisan dan flow narasi
4. Repetisi atau pola yang tidak alami
5. Marker khas AI vs human writing
6. Kompleksitas dan variasi bahasa

Berikan analisis dalam bahasa Indonesia yang mudah dipahami.
`;

    // Retry logic with exponential backoff
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`GPT Analysis attempt ${attempt}/${maxRetries}`);

        // Create timeout promise
        const timeoutDuration = GPT_TIMEOUT_DURATION + (attempt * 5000); // Increase timeout per attempt
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout - GPT analysis took too long')), timeoutDuration);
        });

        // Race between API call and timeout
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: GPT_MODEL, // Use configured model
            messages: [
              {
                role: "system",
                content: "Kamu adalah ahli linguistik yang dapat menganalisis pola penulisan untuk mendeteksi apakah teks ditulis oleh AI atau manusia. Berikan analisis yang detail dan objektif."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2000
            // Remove timeout parameter - it's not supported in the API call
          }),
          timeoutPromise
        ]);

        const analysis = completion.choices[0].message.content;
        
        // Validate the response
        if (!analysis || analysis.trim().length === 0) {
          throw new Error('Empty response from GPT');
        }
        
        // Cache successful result
        analysisCache.set(cacheKey, {
          data: analysis,
          timestamp: Date.now()
        });

        console.log(`GPT Analysis - Success on attempt ${attempt}, response length: ${analysis.length}`);
        return { analysis };

      } catch (err) {
        lastError = err;
        console.error(`GPT Analysis attempt ${attempt} failed:`, err.message);
        
        if (attempt < maxRetries) {
          const delay = 2000 * attempt; // Linear backoff: 2s, 4s
          console.log(`Retrying GPT analysis in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    // All retries failed, throw the last error
    throw lastError;

  } catch (err) {
    console.error('GPT Analysis Error - All attempts failed:', err.message);
    console.error('Full error details:', err);
    
    // Don't return fallback automatically - let controller handle the error
    throw new Error(`GPT Analysis failed: ${err.message}`);
  }
};

// Optional: Export cache statistics for monitoring
exports.getCacheStats = () => {
  cleanCache();
  return {
    size: analysisCache.size,
    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    hitRate: 'Use logging to track hit rate'
  };
};

// Optional: Clear cache manually (useful for testing or admin purposes)
exports.clearCache = () => {
  analysisCache.clear();
  console.log('GPT Analysis cache cleared');
};