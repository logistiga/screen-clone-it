import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail, LogIn, Eye, EyeOff, User } from "lucide-react";
import logo from "@/assets/logistiga-logo-new.png";
import loginAnimation from "@/assets/login-animation.gif";
export default function LoginPage() {
  const navigate = useNavigate();
  const {
    login,
    isAuthenticated
  } = useAuth();
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si déjà connecté
  if (isAuthenticated) {
    navigate("/", {
      replace: true
    });
    return null;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError("Veuillez saisir votre adresse email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide");
      return;
    }
    if (!password) {
      setError("Veuillez saisir votre mot de passe");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setIsLoading(true);
    const result = await login(email, password);
    if (result.success) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur LOJISTIGA"
      });
      navigate("/", {
        replace: true
      });
    } else {
      setError(result.error || "Erreur de connexion");
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen flex">
      {/* Section gauche - Gris route avec GIF */}
      <motion.div initial={{
      x: -100,
      opacity: 0
    }} animate={{
      x: 0,
      opacity: 1
    }} transition={{
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }} className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
      backgroundColor: "#f5f5f5"
    }}>
        {/* Forme courbe rouge */}
        <div className="absolute right-0 top-0 h-full w-32" style={{
        background: "#DC2626",
        borderRadius: "100% 0 0 100% / 50% 0 0 50%",
        transform: "translateX(50%)"
      }} />
        
        {/* Animation GIF - Route */}
        <div className="flex items-center justify-center w-full h-full relative z-10 p-8">
          <motion.img 
            src={loginAnimation} 
            alt="LOJISTIGA Animation" 
            className="max-w-full max-h-full object-contain"
            initial={{
              scale: 0.95,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            transition={{
              delay: 0.3,
              duration: 0.6
            }}
          />
        </div>
      </motion.div>

      {/* Section droite - ROUGE avec formulaire */}
      <motion.div initial={{
      x: 100,
      opacity: 0
    }} animate={{
      x: 0,
      opacity: 1
    }} transition={{
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }} className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12" style={{
      background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)"
    }}>
        <div className="w-full max-w-md space-y-8">
          {/* Avatar et titre */}
          <motion.div initial={{
          y: -20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.2
        }} className="text-center">
            {/* Avatar/Icon */}
            <div className="flex justify-center mb-6">
              <motion.div className="relative" whileHover={{
              scale: 1.05
            }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg bg-white/20 backdrop-blur-sm border-2 border-white/30">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-red-600 shadow-md">
                  <Lock className="h-3 w-3 text-red-600" />
                </div>
              </motion.div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              BIENVENUE
            </h1>
            <p className="text-white/80">
              Connectez-vous à votre espace LOJISTIGA
            </p>
          </motion.div>

          {/* Formulaire */}
          <motion.form onSubmit={handleSubmit} initial={{
          y: 20,
          opacity: 0
        }} animate={{
          y: 0,
          opacity: 1
        }} transition={{
          delay: 0.3
        }} className="space-y-6">
            {error && <motion.div initial={{
            opacity: 0,
            y: -10
          }} animate={{
            opacity: 1,
            y: 0
          }}>
                <Alert className="bg-white/10 border-white/20 text-white">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Adresse email
              </Label>
              <div className="relative">
                <Input id="email" type="email" placeholder="exemple@lojistiga.com" value={email} onChange={e => setEmail(e.target.value)} className="h-12 pl-4 pr-4 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 focus:border-white focus:bg-white/20 rounded-lg transition-all" autoComplete="email" disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <button type="button" className="text-sm text-white/80 hover:text-white transition-colors underline-offset-2 hover:underline">
                  Mot de passe oublié?
                </button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-12 pl-4 pr-12 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50 focus:border-white focus:bg-white/20 rounded-lg transition-all" autoComplete="current-password" disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.div whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }}>
              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg bg-white text-red-600 hover:bg-white/90 shadow-lg shadow-black/20 transition-all" disabled={isLoading}>
                {isLoading ? <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </> : <>
                    <LogIn className="mr-2 h-5 w-5" />
                    CONNEXION
                  </>}
              </Button>
            </motion.div>
          </motion.form>

          {/* Footer */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.5
        }} className="pt-6 text-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-4" />
            <p className="text-xs text-white/60">
              © {new Date().getFullYear()} LOJISTIGA - Tous droits réservés
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Version mobile - fond rouge uniquement */}
      <style>{`
        @media (max-width: 1023px) {
          .min-h-screen {
            background: linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%);
          }
        }
      `}</style>
    </div>;
}