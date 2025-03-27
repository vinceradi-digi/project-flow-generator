
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, FileText } from "lucide-react";
import { toast } from "sonner";

interface Epic {
  id: string;
  title: string;
  description: string;
  stories?: UserStory[];
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
}

interface EpicsViewProps {
  projectId: string;
}

const EpicsView = ({ projectId }: EpicsViewProps) => {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [specification, setSpecification] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load specification and epics from localStorage
    const savedSpec = localStorage.getItem(`project_${projectId}_specification`);
    const savedEpics = localStorage.getItem(`project_${projectId}_epics`);
    
    if (savedSpec) setSpecification(savedSpec);
    if (savedEpics) setEpics(JSON.parse(savedEpics));
  }, [projectId]);

  const viewUserStories = (epicId: string) => {
    navigate(`/project/${projectId}?tab=stories&epic=${epicId}`);
  };

  if (!specification) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">Spécifications manquantes</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Vous devez d'abord générer les spécifications du projet pour accéder aux EPICs.
        </p>
        <Button 
          variant="default" 
          onClick={() => navigate(`/project/${projectId}?tab=specification`)}
        >
          Générer les spécifications
        </Button>
      </div>
    );
  }

  if (epics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">Aucun EPIC disponible</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Les EPICs seront générés automatiquement à partir des spécifications.
        </p>
        <Button 
          variant="default" 
          onClick={() => {
            // Generate mock epics
            const mockEpics = [
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
            
            setEpics(mockEpics);
            localStorage.setItem(`project_${projectId}_epics`, JSON.stringify(mockEpics));
            toast.success("EPICs générés avec succès");
          }}
        >
          Générer les EPICs
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {epics.map((epic) => (
        <Card key={epic.id} className="glass-card overflow-hidden animate-scale-in flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg line-clamp-1">{epic.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                EPIC
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {epic.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-2 flex-grow">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{epic.stories?.length || 0} User Stories</span>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              variant="default" 
              className="w-full group"
              onClick={() => viewUserStories(epic.id)}
            >
              User Stories
              <ArrowRight className="ml-2 h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </Button>
          </CardFooter>
        </Card>
      ))}
      <Card className="glass-card h-full min-h-[200px] flex flex-col justify-center items-center p-6 border-dashed animate-scale-in">
        <Plus className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="text-muted-foreground text-center mb-2">Ajouter un EPIC</CardTitle>
        <CardDescription className="text-center mb-4">
          Créez un nouvel EPIC pour votre projet
        </CardDescription>
        <Button 
          variant="outline" 
          onClick={() => toast.info("Fonctionnalité à venir")}
        >
          Nouvel EPIC
        </Button>
      </Card>
    </div>
  );
};

export default EpicsView;
