const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

exports.analyzeTextWithGemini = async (text, prediction, confidence) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const result = await model.generateContent(prompt);
    return { analysis: result.response.text() };
  } catch (err) {
    throw new Error('Gemini analysis failed: ' + err.message);
  }
};