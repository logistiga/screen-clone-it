import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail, LogIn, Eye, EyeOff, User, Truck, Package, Ship } from "lucide-react";
import logo from "@/assets/logistiga-logo-new.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si déjà connecté
  if (isAuthenticated) {
    navigate("/", { replace: true });
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
        description: "Bienvenue sur LOJISTIGA",
      });
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Erreur de connexion");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Illustration avec courbe */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 50%, #4F46E5 100%)"
        }}
      >
        {/* Forme courbe */}
        <div 
          className="absolute right-0 top-0 h-full w-32"
          style={{
            background: "white",
            borderRadius: "100% 0 0 100% / 50% 0 0 50%",
            transform: "translateX(50%)"
          }}
        />
        
        {/* Contenu illustratif */}
        <div className="flex flex-col items-center justify-center w-full p-12 relative z-10">
          {/* Illustration smartphone/app */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative"
          >
            {/* Téléphone stylisé */}
            <div className="relative">
              <div className="w-48 h-80 bg-slate-900/30 backdrop-blur-sm rounded-3xl border-4 border-white/20 flex flex-col items-center justify-center p-4 shadow-2xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-2 bg-white/20 rounded-full" />
                
                {/* Icône de camion animée */}
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Truck className="h-10 w-10 text-white" />
                  </div>
                </motion.div>

                {/* Lignes de contenu */}
                <div className="space-y-3 w-full">
                  <div className="h-3 bg-white/30 rounded-full w-3/4 mx-auto" />
                  <div className="h-3 bg-white/20 rounded-full w-1/2 mx-auto" />
                  <div className="h-3 bg-white/25 rounded-full w-2/3 mx-auto" />
                </div>
              </div>

              {/* Icônes flottantes */}
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute -left-8 top-16"
              >
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 8, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -right-6 top-32"
              >
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <Ship className="h-7 w-7 text-white" />
                </div>
              </motion.div>

              {/* Personnage silhouette */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -right-16 -bottom-4"
              >
                <div className="relative">
                  <div className="w-16 h-40 relative">
                    {/* Corps simplifié */}
                    <div className="absolute bottom-0 w-full">
                      <div className="w-10 h-24 bg-slate-800/60 rounded-t-full mx-auto" />
                      <div className="w-8 h-8 bg-slate-700/60 rounded-full mx-auto -mt-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Étoiles/points décoratifs */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-white/40 rounded-full" />
          <div className="absolute top-32 right-40 w-3 h-3 bg-white/30 rounded-full" />
          <div className="absolute bottom-40 left-32 w-2 h-2 bg-white/50 rounded-full" />
          <div className="absolute bottom-20 right-48 w-1.5 h-1.5 bg-white/40 rounded-full" />
          
          {/* Lune décorative */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-24 left-24"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full shadow-lg shadow-yellow-400/30" />
          </motion.div>
        </div>
      </motion.div>

      {/* Section droite - Formulaire */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-900"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo et titre */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            {/* Avatar/Icon */}
            <div className="flex justify-center mb-6">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 100%)"
                  }}
                >
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              </motion.div>
            </div>

            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              BIENVENUE
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Connectez-vous à votre espace LOJISTIGA
            </p>
          </motion.div>

          {/* Formulaire */}
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Adresse email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@lojistiga.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-4 pr-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-lg transition-all"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <button
                  type="button"
                  className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                >
                  Mot de passe oublié?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-4 pr-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-lg transition-all"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
                style={{
                  background: "linear-gradient(135deg, #5B4FE9 0%, #7C3AED 100%)"
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    CONNEXION
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          {/* Logo en bas */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-6 flex flex-col items-center gap-4"
          >
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
            <img src={logo} alt="LOJISTIGA" className="h-10 opacity-80" />
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} LOJISTIGA - Tous droits réservés
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
