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

export const generateProjectSpecifications = async (
  projectTitle: string,
  projectDescription: string
): Promise<ProjectContent> => {
  try {
    console.log('Début de la génération des spécifications...');
    console.log('Clé API disponible:', !!OPENAI_CONFIG.apiKey);

    if (!OPENAI_CONFIG.apiKey) {
      throw new Error('La clé API OpenAI n\'est pas configurée');
    }

    // 1. Créer un thread
    console.log('Création du thread...');
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
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
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        role: 'user',
        content: `Projet : ${projectTitle}\n\nDescription détaillée : ${projectDescription}\n\nMerci de générer les EPICs et User Stories pour ce projet selon le format spécifié dans tes instructions.`
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
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({
        assistant_id: 'asst_FCjQ7uT86lbc2y1oz9opxgpO'
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
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
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
    console.error('Erreur détaillée lors de la génération des spécifications:', error);
    throw error;
  }
};

const checkRunStatus = async (threadId: string, runId: string) => {
  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    headers: {
      'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
      'OpenAI-Beta': 'assistants=v1'
    }
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la vérification du statut: ${response.status}`);
  }

  return response.json();
};

const parseAssistantResponse = (response: string): ProjectContent => {
  // Cette fonction devra être adaptée en fonction du format exact de la réponse de l'assistant
  // Pour l'instant, on retourne une structure basique
  try {
    // Ici, vous devrez implémenter la logique de parsing selon le format de réponse de votre assistant
    // C'est un exemple simplifié :
    const epics = response.split('EPIC').filter(Boolean).map(epicText => {
      // Logique de parsing à adapter selon le format exact de la réponse
      return {
        title: extractValue(epicText, 'Nom de l\'EPIC'),
        objective: extractValue(epicText, 'Objectif'),
        problemAddressed: extractValue(epicText, 'Problématique adressée'),
        businessValue: extractValue(epicText, 'Valeur métier'),
        stories: extractUserStories(epicText)
      };
    });

    return { epics };
  } catch (error) {
    console.error('Erreur lors du parsing de la réponse:', error);
    throw new Error('Format de réponse invalide');
  }
};

const extractValue = (text: string, field: string): string => {
  const regex = new RegExp(`${field}\\s*:\\s*([^\\n]+)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

const extractUserStories = (epicText: string): UserStory[] => {
  // Cette fonction devra être adaptée en fonction du format exact des user stories dans la réponse
  const stories = epicText.split('User Story').filter(Boolean).map(storyText => {
    return {
      epic: extractValue(epicText, 'Nom de l\'EPIC'),
      story: extractValue(storyText, 'En tant que'),
      acceptanceCriteria: extractAcceptanceCriteria(storyText),
      kpis: extractValue(storyText, 'KPIs définis'),
      designLink: extractValue(storyText, 'Lien vers la maquette')
    };
  });

  return stories;
};

const extractAcceptanceCriteria = (storyText: string): { given: string; when: string; then: string; }[] => {
  // Cette fonction devra être adaptée en fonction du format exact des critères d'acceptance
  const criteriaRegex = /Étant donné\s+([^,]+),\s*Quand\s+([^,]+),\s*Alors\s+([^.]+)/g;
  const criteria: { given: string; when: string; then: string; }[] = [];
  
  let match;
  while ((match = criteriaRegex.exec(storyText)) !== null) {
    criteria.push({
      given: match[1].trim(),
      when: match[2].trim(),
      then: match[3].trim()
    });
  }

  return criteria;
}; 