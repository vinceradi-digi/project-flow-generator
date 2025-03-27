
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SpecificationViewProps {
  projectId: string;
}

const SpecificationView = ({ projectId }: SpecificationViewProps) => {
  const [needsDescription, setNeedsDescription] = useState("");
  const [specification, setSpecification] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load from localStorage if exists
    const savedNeeds = localStorage.getItem(`project_${projectId}_needs`);
    const savedSpec = localStorage.getItem(`project_${projectId}_specification`);
    
    if (savedNeeds) setNeedsDescription(savedNeeds);
    if (savedSpec) setSpecification(savedSpec);
  }, [projectId]);

  const generateSpecification = async () => {
    if (!needsDescription.trim()) {
      toast.error("L'expression de besoin ne peut pas être vide");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call for spec generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generation - In a real app, this would come from an AI service
      const generatedSpec = `# Spécifications du projet
      
## Contexte et objectifs
${needsDescription}

## Utilisateurs cibles
- Chefs de projets
- Product owners
- Développeurs
- Parties prenantes métier

## Fonctionnalités clés
1. Interface de gestion de projets
2. Système de création de spécifications
3. Génération automatique d'EPICs
4. Découpage en User Stories
5. Suivi de l'avancement du projet

## Exigences techniques
- Application web responsive
- Interface intuitive et modern
- Système d'authentification sécurisé
- Sauvegarde automatique des données

## Contraintes
- Respect des normes RGPD
- Interface multilingue (français, anglais)
- Performance et temps de réponse optimisés

## Livrables attendus
- Application web fonctionnelle
- Documentation technique
- Guide utilisateur
`;
      
      setSpecification(generatedSpec);
      
      // Save to localStorage
      localStorage.setItem(`project_${projectId}_needs`, needsDescription);
      localStorage.setItem(`project_${projectId}_specification`, generatedSpec);
      
      // Generate EPICs based on specification
      const epics = [
        {
          id: "epic1",
          title: "Système d'authentification",
          description: "Permettre aux utilisateurs de s'inscrire et se connecter"
        },
        {
          id: "epic2",
          title: "Gestion de projets",
          description: "Fonctionnalités de création et gestion de projets"
        },
        {
          id: "epic3",
          title: "Génération de spécifications",
          description: "Module d'IA pour générer des spécifications à partir de besoins"
        },
        {
          id: "epic4",
          title: "Système d'EPICs",
          description: "Gestion des EPICs liés aux projets"
        },
        {
          id: "epic5",
          title: "User Stories",
          description: "Gestion des User Stories liées aux EPICs"
        }
      ];
      
      localStorage.setItem(`project_${projectId}_epics`, JSON.stringify(epics));
      
      toast.success("Spécifications générées avec succès");
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la génération");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSpecification = () => {
    if (specification) {
      localStorage.setItem(`project_${projectId}_specification`, specification);
      toast.success("Spécifications enregistrées");
      setIsEditing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {!specification ? (
        <Card className="glass-container">
          <CardHeader>
            <CardTitle className="text-xl">Expression de besoin</CardTitle>
            <CardDescription>
              Décrivez votre idée de produit ou projet pour générer des spécifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Décrivez votre projet, ses objectifs, ses utilisateurs cibles et les fonctionnalités attendues..."
              className="min-h-[200px] resize-none"
              value={needsDescription}
              onChange={(e) => setNeedsDescription(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={generateSpecification} 
              disabled={isGenerating || !needsDescription.trim()}
              className="ml-auto"
            >
              {isGenerating ? "Génération en cours..." : "Générer les spécifications"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="glass-container">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl">Spécifications du Projet</CardTitle>
              <CardDescription>
                Document généré à partir de votre expression de besoin
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Généré automatiquement
              </Badge>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={saveSpecification}>
                  Sauvegarder
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                className="min-h-[400px] font-mono text-sm"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap bg-secondary/50 p-4 rounded-md overflow-auto">
                  {specification}
                </pre>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setSpecification(null);
                setNeedsDescription("");
                localStorage.removeItem(`project_${projectId}_specification`);
                localStorage.removeItem(`project_${projectId}_needs`);
              }}
            >
              Recommencer
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SpecificationView;
