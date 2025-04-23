import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Project } from "@/components/ProjectCard";
import { toast } from "sonner";

interface Epic {
  title: string;
  description: string;
  stories: {
    title: string;
    description: string;
  }[];
}

interface ProjectContent {
  epics: Epic[];
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projectContent, setProjectContent] = useState<ProjectContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Charger les détails du projet
    const loadProject = () => {
      const projects = JSON.parse(localStorage.getItem("projects") || "[]");
      const foundProject = projects.find((p: Project) => p.id === projectId);
      
      if (foundProject) {
        setProject(foundProject);
        // Charger les EPICs et Stories générés
        const content = localStorage.getItem(`project_${projectId}_content`);
        if (content) {
          setProjectContent(JSON.parse(content));
        }
      } else {
        toast.error("Projet non trouvé");
        navigate("/");
      }
      setIsLoading(false);
    };

    loadProject();
  }, [projectId, navigate]);

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center items-center py-12">
          <p>Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate("/")} className="group">
          <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </div>

      {projectContent ? (
        <div className="space-y-8">
          {projectContent.epics.map((epic, epicIndex) => (
            <Card key={epicIndex} className="glass-card">
              <CardHeader>
                <CardTitle className="text-xl">
                  EPIC {epicIndex + 1}: {epic.title}
                </CardTitle>
                <p className="text-muted-foreground">{epic.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {epic.stories.map((story, storyIndex) => (
                    <Card key={storyIndex} className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          User Story {storyIndex + 1}: {story.title}
                        </CardTitle>
                        <p className="text-muted-foreground">{story.description}</p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Aucun contenu trouvé</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Les EPICs et User Stories n'ont pas pu être chargés pour ce projet.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
