
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProjectCard, { Project } from "@/components/ProjectCard";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // Load projects from localStorage or use mock data if none exists
    const savedProjects = localStorage.getItem("projects");
    
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      // Mock projects for demo purposes
      const mockProjects = [
        {
          id: "project1",
          title: "Application mobile de gestion des tâches",
          description: "Développement d'une application mobile pour la gestion des tâches quotidiennes, avec synchronisation cloud et notifications.",
          createdAt: new Date().toISOString(),
          epicsCount: 5,
          storiesCount: 15
        },
        {
          id: "project2",
          title: "Plateforme e-commerce B2B",
          description: "Création d'une plateforme e-commerce dédiée aux transactions entre entreprises, avec gestion des devis et facturation automatique.",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          epicsCount: 8,
          storiesCount: 24
        }
      ];
      
      setProjects(mockProjects);
      localStorage.setItem("projects", JSON.stringify(mockProjects));
    }
    
    setIsLoading(false);
  }, [navigate]);

  const createProject = () => {
    if (!newProject.title.trim()) {
      toast.error("Le titre du projet est requis");
      return;
    }

    const newProjectData: Project = {
      id: `project${Date.now()}`,
      title: newProject.title,
      description: newProject.description || "Aucune description",
      createdAt: new Date().toISOString(),
      epicsCount: 0,
      storiesCount: 0
    };

    const updatedProjects = [newProjectData, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    
    setNewProject({ title: "", description: "" });
    setIsDialogOpen(false);
    toast.success("Projet créé avec succès");
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets de développement produit
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="self-start">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass-container">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
              <DialogDescription>
                Définissez le titre et la description de votre nouveau projet.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Titre
                </label>
                <Input
                  id="title"
                  placeholder="Nom du projet"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Description du projet"
                  rows={4}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={createProject}>Créer le projet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Rechercher un projet..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <p>Chargement des projets...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-lg">
          <h3 className="text-xl font-medium mb-2">Aucun projet trouvé</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {searchQuery 
              ? "Aucun projet ne correspond à votre recherche. Essayez avec d'autres termes." 
              : "Vous n'avez pas encore de projets. Créez votre premier projet pour commencer."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un projet
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
