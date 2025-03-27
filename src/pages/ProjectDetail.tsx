import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpecificationView from "@/components/SpecificationView";
import EpicsView from "@/components/EpicsView";
import UserStoriesView from "@/components/UserStoriesView";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type ProjectDetailParams = {
  id: string;
};

const ProjectDetail = () => {
  const { id } = useParams<ProjectDetailParams>();
  const [projectTitle, setProjectTitle] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the current tab from URL search params
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab") || "specification";
  
  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (!id) {
      navigate("/dashboard");
      toast.error("Projet non trouvé");
      return;
    }
    
    // Load project details
    const savedProjects = localStorage.getItem("projects");
    
    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      const project = projects.find((p: any) => p.id === id);
      
      if (project) {
        setProjectTitle(project.title);
      } else {
        navigate("/dashboard");
        toast.error("Projet non trouvé");
      }
    } else {
      navigate("/dashboard");
      toast.error("Aucun projet disponible");
    }
  }, [id, navigate]);

  const handleTabChange = (value: string) => {
    // Update URL when tab changes
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set("tab", value);
    
    // Keep epic parameter if it exists when switching to stories tab
    if (value === "stories" && !newSearchParams.has("epic")) {
      // If switching to stories without an epic specified, try to get the first epic
      const epics = localStorage.getItem(`project_${id}_epics`);
      if (epics) {
        const parsedEpics = JSON.parse(epics);
        if (parsedEpics.length > 0) {
          newSearchParams.set("epic", parsedEpics[0].id);
        }
      }
    }
    
    // If switching away from stories, remove epic parameter
    if (value !== "stories") {
      newSearchParams.delete("epic");
    }
    
    navigate(`/project/${id}?${newSearchParams.toString()}`);
  };

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-2 pl-0 hover:bg-transparent"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux projets
        </Button>
        <h1 className="text-3xl font-bold">{projectTitle}</h1>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="specification">Spécifications</TabsTrigger>
          <TabsTrigger value="epics">EPICs</TabsTrigger>
          <TabsTrigger value="stories">User Stories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specification" className="mt-6 tab-transition-enter">
          {id && <SpecificationView projectId={id} />}
        </TabsContent>
        
        <TabsContent value="epics" className="mt-6 tab-transition-enter">
          {id && <EpicsView projectId={id} />}
        </TabsContent>
        
        <TabsContent value="stories" className="mt-6 tab-transition-enter">
          {id && <UserStoriesView projectId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
