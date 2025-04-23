import { OPENAI_CONFIG } from "@/config/openai";

interface UserStory {
  epic: string;
  story: string;
  acceptanceCriteria: {
    given: string;
    when: string;
    then: string;
  }[];
  kpis: string;
  designLink: string;
}

interface Epic {
  title: string;
  objective: string;
  problemAddressed: string;
  businessValue: string;
  stories: UserStory[];
}

interface ProjectContent {
  epics: Epic[];
}

// ID de l'assistant IA pour la génération des projets
const ASSISTANT_ID = 'asst_FCjQ7uT86lbc2y1oz9opxgpO';

// Fonction pour vérifier si l'assistant existe
const checkAssistantExists = async (apiKey: string, assistantId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de vérification de l'assistant ${assistantId}...`);
    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Assistant ${assistantId} trouvé et accessible.`);
      return true;
    } else {
      const errorData = await response.text();
      console.error(`❌ Erreur lors de la vérification de l'assistant: ${response.status}`, errorData);
      
      // Si nous sommes en mode développement, autoriser le mode de secours
      if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        console.warn("⚠️ Mode développement détecté, contournement de la vérification de l'assistant pour tests");
        return true; // Retourne true en mode développement pour permettre les tests
      }
      return false;
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification de l'assistant:", error);
    
    // Si nous sommes en mode développement, autoriser le mode de secours
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      console.warn("⚠️ Mode développement détecté, contournement de la vérification de l'assistant pour tests");
      return true; // Retourne true en mode développement pour permettre les tests
    }
    return false;
  }
};

export const generateProjectSpecifications = async (
  projectTitle: string,
  projectDescription: string
): Promise<ProjectContent> => {
  try {
    console.log('Début de la génération des spécifications...');
    console.log('Clé API disponible:', !!OPENAI_CONFIG.apiKey);
    
    if (!OPENAI_CONFIG.apiKey) {
      throw new Error('La clé API OpenAI n\'est pas configurée dans le fichier .env (VITE_OPENAI_API_KEY)');
    }
    
    // Vérification et nettoyage de la clé API
    const apiKey = OPENAI_CONFIG.apiKey.trim();
    console.log('Longueur de la clé API:', apiKey.length);
    
    // Mode de développement - Simuler la réponse de l'API pour les tests
    if (import.meta.env.DEV && (apiKey === 'sk-test-key123456789' || !apiKey.startsWith('sk-'))) {
      console.log('⚠️ Mode développement détecté avec une clé de test. Utilisation du mode de simulation.');
      return generateMockProjectContent(projectTitle, projectDescription);
    }
    
    if (apiKey.length < 20) {
      throw new Error(`La clé API OpenAI semble trop courte (${apiKey.length} caractères)`);
    }
    
    if (!apiKey.startsWith('sk-')) {
      throw new Error('La clé API OpenAI semble invalide (ne commence pas par sk-)');
    }
    
    // Vérifier si l'assistant existe
    console.log(`Vérification de l'existence de l'assistant ${ASSISTANT_ID}...`);
    const assistantExists = await checkAssistantExists(apiKey, ASSISTANT_ID);
    if (!assistantExists) {
      throw new Error(`L'assistant avec l'ID ${ASSISTANT_ID} n'existe pas ou n'est pas accessible avec cette clé API. Vérifiez que vous avez créé l'assistant dans votre compte OpenAI.`);
    }
    console.log(`Assistant ${ASSISTANT_ID} trouvé.`);

    // 1. Créer un thread
    console.log('Création du thread...');
    try {
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.text();
        console.error('Erreur thread response:', error);
        throw new Error(`Erreur lors de la création du thread: ${threadResponse.status} - ${error}`);
      }

      const thread = await threadResponse.json();
      console.log('Thread créé:', thread.id);

      // 2. Ajouter un message au thread
      console.log('Ajout du message au thread...');
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          role: 'user',
          content: `Je veux créer un nouveau projet intitulé "${projectTitle}" avec la description suivante: "${projectDescription}".

Merci de générer les EPICs et User Stories pour ce projet selon le format que tu connais déjà. Je souhaite pouvoir accéder directement à ces éléments dans l'application.`
        })
      });

      if (!messageResponse.ok) {
        const error = await messageResponse.text();
        console.error('Erreur message response:', error);
        throw new Error(`Erreur lors de l'ajout du message: ${messageResponse.status} - ${error}`);
      }

      console.log('Message ajouté au thread');

      // 3. Exécuter l'assistant
      console.log('Lancement de l\'assistant...');
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID
        })
      });

      if (!runResponse.ok) {
        const error = await runResponse.text();
        console.error('Erreur run response:', error);
        throw new Error(`Erreur lors du lancement de l'assistant: ${runResponse.status} - ${error}`);
      }

      const run = await runResponse.json();
      console.log('Run créé:', run.id);

      // 4. Attendre la réponse (polling)
      console.log('Attente de la réponse...');
      let runStatus = await checkRunStatus(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 30; // 30 secondes maximum

      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        if (runStatus.status === 'failed') {
          console.error('Run status failed:', runStatus);
          throw new Error('La génération a échoué: ' + runStatus.last_error?.message || 'Erreur inconnue');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await checkRunStatus(thread.id, run.id);
        attempts++;
        console.log('Status actuel:', runStatus.status, `(tentative ${attempts}/${maxAttempts})`);
      }

      if (attempts >= maxAttempts) {
        throw new Error('Timeout: La génération a pris trop de temps');
      }

      // 5. Récupérer les messages
      console.log('Récupération des messages...');
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v1'
        }
      });

      if (!messagesResponse.ok) {
        const error = await messagesResponse.text();
        console.error('Erreur messages response:', error);
        throw new Error(`Erreur lors de la récupération des messages: ${messagesResponse.status} - ${error}`);
      }

      const messages = await messagesResponse.json();
      const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');

      if (!assistantMessage) {
        throw new Error('Pas de réponse de l\'assistant');
      }

      console.log('Réponse reçue de l\'assistant');

      // 6. Parser et formater la réponse
      console.log('Parsing de la réponse...');
      const content = assistantMessage.content[0].text.value;
      console.log('Contenu brut reçu:', content);

      return parseAssistantResponse(content);
    } catch (error) {
      console.error('Erreur lors de la création du thread:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erreur détaillée lors de la génération des spécifications:', error);
    throw error;
  }
};

const checkRunStatus = async (threadId: string, runId: string) => {
  const apiKey = OPENAI_CONFIG.apiKey.trim();
  
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v1'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur lors de la vérification du statut: ${response.status} - ${errorText}`);
  }

  return response.json();
};

const parseAssistantResponse = (response: string): ProjectContent => {
  try {
    console.log('Parsing de la réponse de l\'assistant...');
    
    // Tentative de parsing JSON si la réponse est déjà au format JSON
    try {
      // Chercher un objet JSON dans la réponse
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/) ||
                        response.match(/\{[\s\S]*"epics"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        const parsedContent = JSON.parse(jsonContent);
        
        if (parsedContent.epics && Array.isArray(parsedContent.epics)) {
          console.log('Contenu JSON trouvé et parsé avec succès');
          return parsedContent;
        }
      }
    } catch (jsonError) {
      console.log('Pas de JSON valide détecté, passage au parsing par texte');
    }
    
    // Si pas de JSON valide, on passe au parsing par texte
    const epics = response.split(/EPIC\s*\d*\s*:|EPIC\s*:/).filter(Boolean).map(epicText => {
      // Pour chaque EPIC, extraire les informations pertinentes
      const title = extractValue(epicText, 'Titre|Nom( de l\'EPIC)?|Title');
      const objective = extractValue(epicText, 'Objectif|Objective');
      const problemAddressed = extractValue(epicText, 'Problématique( adressée)?|Problem( addressed)?');
      const businessValue = extractValue(epicText, 'Valeur( métier)?|Business value');
      
      // Extraction des User Stories de l'EPIC
      const stories = extractUserStories(epicText, title);
      
      return {
        title: title || 'EPIC sans titre',
        objective: objective || '',
        problemAddressed: problemAddressed || '',
        businessValue: businessValue || '',
        stories: stories
      };
    });

    if (epics.length === 0) {
      console.warn('Aucun EPIC trouvé dans la réponse. Format potentiellement non reconnu.');
      // Créer un EPIC par défaut pour éviter de retourner un tableau vide
      return { 
        epics: [{
          title: 'EPIC par défaut',
          objective: 'Objectif non spécifié',
          problemAddressed: 'Problème non spécifié',
          businessValue: 'Valeur non spécifiée',
          stories: []
        }]
      };
    }

    console.log(`${epics.length} EPICs extraits avec ${epics.reduce((acc, epic) => acc + epic.stories.length, 0)} User Stories au total`);
    return { epics };
  } catch (error) {
    console.error('Erreur lors du parsing de la réponse:', error);
    throw new Error('Format de réponse invalide');
  }
};

const extractValue = (text: string, fieldPattern: string): string => {
  const regex = new RegExp(`(${fieldPattern})\\s*:?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[2].trim() : '';
};

const extractUserStories = (epicText: string, epicTitle: string): UserStory[] => {
  // Extraction des User Stories avec différents patterns possibles
  const storyBlocks = epicText.split(/User Story\s*\d*\s*:|US\s*\d*\s*:|Story\s*\d*\s*:/).filter(Boolean);
  
  // Si pas de blocs, on renvoie un tableau vide
  if (storyBlocks.length <= 1) {
    return [];
  }
  
  // On ignore le premier bloc qui est généralement la description de l'EPIC
  const stories = storyBlocks.slice(1).map(storyText => {
    const story = extractValue(storyText, 'En tant que|As a|Description|Je souhaite|I want to');
    
    return {
      epic: epicTitle,
      story: story || 'User Story sans description',
      acceptanceCriteria: extractAcceptanceCriteria(storyText),
      kpis: extractValue(storyText, 'KPIs?( définis)?|Mesures') || 'Aucun KPI défini',
      designLink: extractValue(storyText, 'Lien (vers la )?maquette|Design link') || ''
    };
  });

  return stories;
};

const extractAcceptanceCriteria = (storyText: string): { given: string; when: string; then: string; }[] => {
  // Patterns pour détecter les critères d'acceptation avec différentes formulations
  const patterns = [
    // Format: Étant donné X, Quand Y, Alors Z
    /(?:Étant donné|Given|Soit|Sachant que)\s+([^,;]+)[,;]\s*(?:Quand|When|Lorsque)\s+([^,;]+)[,;]\s*(?:Alors|Then)\s+([^.;]+)[.;]?/gi,
    
    // Format sur plusieurs lignes ou avec des tirets/bullets
    /(?:-\s*)?(?:Étant donné|Given|Soit|Sachant que)\s+([^,;\n]+)[,;\n]\s*(?:-\s*)?(?:Quand|When|Lorsque)\s+([^,;\n]+)[,;\n]\s*(?:-\s*)?(?:Alors|Then)\s+([^.;\n]+)[.;\n]?/gi
  ];
  
  const criteria: { given: string; when: string; then: string; }[] = [];
  
  // Essayer chaque pattern
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(storyText)) !== null) {
      criteria.push({
        given: match[1].trim(),
        when: match[2].trim(),
        then: match[3].trim()
      });
    }
    
    // Si on a trouvé des critères avec ce pattern, on arrête la recherche
    if (criteria.length > 0) {
      break;
    }
  }
  
  // Si aucun critère n'a été trouvé, on crée un critère par défaut
  if (criteria.length === 0) {
    criteria.push({
      given: 'Condition non spécifiée',
      when: 'Action non spécifiée',
      then: 'Résultat attendu non spécifié'
    });
  }

  return criteria;
};

// Fonction de simulation pour le mode développement
const generateMockProjectContent = (title: string, description: string): ProjectContent => {
  console.log('Génération de contenu simulé pour:', title);
  
  // Calculer un nombre aléatoire d'EPICs (1-3)
  const epicsCount = Math.floor(Math.random() * 3) + 1;
  
  const epics: Epic[] = [];
  
  for (let i = 0; i < epicsCount; i++) {
    // Calculer un nombre aléatoire de stories (1-4)
    const storiesCount = Math.floor(Math.random() * 4) + 1;
    const stories: UserStory[] = [];
    
    for (let j = 0; j < storiesCount; j++) {
      stories.push({
        epic: `EPIC ${i + 1}`,
        story: `En tant qu'utilisateur, je veux ${Math.random() > 0.5 ? 'consulter' : 'gérer'} ${description.split(' ').slice(0, 3).join(' ')} pour améliorer mon expérience.`,
        acceptanceCriteria: [
          {
            given: `Étant donné que je suis sur la page ${Math.random() > 0.5 ? 'principale' : 'de détail'}`,
            when: `Quand je clique sur le bouton ${Math.random() > 0.5 ? 'Ajouter' : 'Modifier'}`,
            then: `Alors ${Math.random() > 0.5 ? 'un formulaire s\'affiche' : 'je suis redirigé vers une nouvelle page'}`
          }
        ],
        kpis: `Augmentation de ${Math.floor(Math.random() * 20) + 10}% d'utilisation de la fonctionnalité`,
        designLink: ''
      });
    }
    
    epics.push({
      title: `EPIC ${i + 1}: ${title} - ${['Interface', 'Administration', 'Gestion', 'Reporting'][i % 4]}`,
      objective: `Permettre aux utilisateurs de ${Math.random() > 0.5 ? 'visualiser' : 'gérer'} facilement ${description.split(' ').slice(0, 3).join(' ')}`,
      problemAddressed: `Difficulté actuelle pour ${Math.random() > 0.5 ? 'accéder aux' : 'comprendre les'} informations`,
      businessValue: `Amélioration de la ${Math.random() > 0.5 ? 'productivité' : 'satisfaction client'} de ${Math.floor(Math.random() * 30) + 10}%`,
      stories
    });
  }
  
  return { epics };
}; 