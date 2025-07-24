const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

exports.analyzeTextWithGPT = async (text, prediction, confidence) => {
  try {
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

    // Debug log
    console.log('GPT Analysis - Starting analysis...');
    console.log('Model:', 'gpt-4o-mini');
    console.log('Text length:', text.length);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1", // Fixed model name
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
    });

    const analysis = completion.choices[0].message.content;
    console.log('GPT Analysis - Success:', analysis ? 'Content received' : 'No content');
    
    return { analysis };
  } catch (err) {
    console.error('GPT Analysis Error:', err.message);
    console.error('Full error:', err);
    throw new Error('OpenAI analysis failed: ' + err.message);
  }
};