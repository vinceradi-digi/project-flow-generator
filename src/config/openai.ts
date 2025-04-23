// Débogage des variables d'environnement
console.log('DEBUG - Variables d\'environnement disponibles:', Object.keys(import.meta.env));
console.log('DEBUG - VITE_OPENAI_API_KEY définie:', !!import.meta.env.VITE_OPENAI_API_KEY);
console.log('DEBUG - Valeur de process.env:', typeof process !== 'undefined' ? 'process.env existe' : 'process.env n\'existe pas');

// Clé de secours pour déboguer (NE PAS METTRE DE VRAIE CLÉ ICI)
const FALLBACK_API_KEY = ''; // Laissez vide pour éviter les problèmes de sécurité

export const OPENAI_CONFIG = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || FALLBACK_API_KEY,
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 2000,
};

// Validation de la configuration
if (!OPENAI_CONFIG.apiKey) {
  console.warn('⚠️ La clé API OpenAI n\'est pas configurée. Veuillez définir VITE_OPENAI_API_KEY dans votre fichier .env');
} else {
  console.log('✅ Clé API OpenAI configurée. Longueur:', OPENAI_CONFIG.apiKey.length);
}
