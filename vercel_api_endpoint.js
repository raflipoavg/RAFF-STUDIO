export default async function handler(req, res) {
    // Hanya benarkan kaedah POST dari frontend
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Hanya permintaan POST dibenarkan.' });
    }

    try {
        // Ambil API Key secara tertutup (secured) dari Vercel Environment Variables
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("[API ERROR]: GEMINI_API_KEY tidak dijumpai dalam Vercel Environment Variables.");
            return res.status(500).json({ error: 'SERVER_API_KEY_MISSING' });
        }

        const { model, parts, requestConfig } = req.body;

        if (!model || !parts) {
            return res.status(400).json({ error: 'BAD_REQUEST', message: 'Parameter model atau parts tidak dijumpai.' });
        }

        // Bina URL endpoint rasmi Gemini API menggunakan API key rahsia
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        // Sediakan payload untuk dihantar ke Google
        const payload = {
            contents: [{ role: 'user', parts: parts }]
        };

        if (requestConfig && requestConfig.generationConfig) {
            payload.generationConfig = requestConfig.generationConfig;
        }

        // Hantar permintaan (fetch) dari Vercel ke Google
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Handle error yang dipulangkan oleh Google Gemini
        if (!response.ok) {
            console.error("[GEMINI ERROR RESPONSE]:", data);
            return res.status(response.status).json(data);
        }

        // Pulangkan data kepada aplikasi frontend jika berjaya
        return res.status(200).json(data);

    } catch (error) {
        console.error("[SERVERLESS EXECUTION ERROR]:", error);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
}