
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type AuthMode = "signin" | "signup";

const AuthForm = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock authentication - in a real app this would connect to a backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Store auth state - in a real app this would be a token from a backend
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", email);
      
      toast.success(mode === "signin" ? "Connecté avec succès" : "Compte créé avec succès");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Une erreur s'est produite");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
  };

  return (
    <Card className="w-full max-w-md animate-scale-in glass-container">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === "signin" 
            ? "Connectez-vous pour accéder à vos projets" 
            : "Créez un compte pour commencer à gérer vos projets"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Chargement..." : mode === "signin" ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={toggleMode}>
          {mode === "signin" ? "Pas de compte ? Créez-en un" : "Déjà un compte ? Connectez-vous"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AuthForm;
