
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col justify-center items-center p-4 animate-fade-in">
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">ProductFlow</h1>
        <p className="text-muted-foreground">
          De l'idée aux tâches de développement
        </p>
      </div>
      
      <AuthForm />
    </div>
  );
};

export default Login;
