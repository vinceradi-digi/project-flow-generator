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
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          created_at,
          status,
          owner_id
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Charger les compteurs séparément
      const projectsWithCounts = await Promise.all(
        (projects || []).map(async (project) => {
          const { count: epicsCount } = await supabase
            .from('workflows')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { count: storiesCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('workflow_step_id', 
              await supabase
                .from('workflow_steps')
                .select('id')
                .in('workflow_id',
                  await supabase
                    .from('workflows')
                    .select('id')
                    .eq('project_id', project.id)
                    .then(result => result.data?.map(w => w.id) || [])
                )
                .then(result => result.data?.map(ws => ws.id) || [])
            );

          return {
            id: project.id,
            title: project.name,
            description: project.description,
            createdAt: project.created_at,
            epicsCount: epicsCount || 0,
            storiesCount: storiesCount || 0
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      toast.error("Erreur lors du chargement des projets");
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.title.trim()) {
      toast.error("Le titre du projet est requis");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.title,
          description: newProject.description || "Aucune description",
          owner_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setNewProject({ title: "", description: "" });
      setIsDialogOpen(false);
      toast.success("Projet créé avec succès");
      
      // Recharger la liste des projets
      loadProjects();
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      toast.error("Erreur lors de la création du projet");
    }
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
