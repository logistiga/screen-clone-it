import { useEffect, useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, LogIn, Eye, EyeOff, Truck } from "lucide-react";
import { triggerPWAInstallAfterLogin } from "@/components/pwa/PWAInstallPrompt";
import loginAnimation from "@/assets/login-animation.gif";

const LoginPage = forwardRef<HTMLDivElement, object>(function LoginPage(_props, ref) {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        description: "Bienvenue sur LOGISTIGA",
      });
      triggerPWAInstallAfterLogin();
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Erreur de connexion");
    }
    setIsLoading(false);
  };

  return (
    <div ref={ref} className="min-h-screen flex overflow-hidden bg-white">
      {/* Section gauche - GIF avec animations de route */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100"
      >
        {/* Ligne de route animée en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <div className="road-lines absolute inset-0 flex items-center">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="h-1 w-12 bg-gray-400 rounded-full mx-4 flex-shrink-0"
                initial={{ x: -100 }}
                animate={{ x: "100vw" }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gray-300" style={{ height: "4px", top: "50%" }} />
        </div>

        {/* Particules flottantes rouges */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/20"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Forme courbe rouge animée */}
        <motion.div
          className="absolute right-0 top-0 h-full w-40"
          style={{
            background: "linear-gradient(180deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)",
            borderRadius: "100% 0 0 100% / 50% 0 0 50%",
            transform: "translateX(50%)",
          }}
          animate={{
            scaleY: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Cercles décoratifs */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 rounded-full border-2 border-primary/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-20 h-20 rounded-full border border-primary/15"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        {/* Animation GIF centrale */}
        <div className="flex items-center justify-center w-full h-full relative z-10 px-8">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Glow effect derrière le GIF */}
            <motion.div
              className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-150"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1.4, 1.6, 1.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <img
              src={loginAnimation}
              alt="LOGISTIGA Animation"
              className="relative max-w-full max-h-[70vh] object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>

        {/* Logo LOGISTIGA en bas à gauche */}
        <motion.div
          className="absolute bottom-24 left-8 flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">LOGISTIGA</h2>
            <p className="text-xs text-gray-500">Transport & Logistique</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Section droite - Formulaire sur fond rouge */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)",
        }}
      >
        {/* Motif de fond animé */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Cercles décoratifs */}
          <motion.div
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full border border-white/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full border border-white/5"
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Lignes de route stylisées */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute top-2/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Avatar et titre */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            {/* Badge transporteur */}
            <motion.div 
              className="flex justify-center mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="relative">
                {/* Cercle pulsant */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/20"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-md border-2 border-white/30 shadow-2xl">
                  <Truck className="h-12 w-12 text-white" />
                </div>
                {/* Badge de sécurité */}
                <motion.div 
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center border-3 border-red-600 shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                >
                  <Lock className="h-4 w-4 text-red-600" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1 
              className="text-4xl font-bold text-white mb-2 tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              CONNEXION
            </motion.h1>
            <motion.p 
              className="text-white/70 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Accédez à votre espace LOGISTIGA
            </motion.p>
          </motion.div>

          {/* Formulaire */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-5"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                >
                  <Alert className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                    <AlertDescription className="font-medium">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="email" className="text-white/90 flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Adresse email
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@logistiga.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-5 pr-5 bg-white/10 backdrop-blur-md border-2 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/20 rounded-xl transition-all duration-300 text-base"
                  autoComplete="email"
                  disabled={isLoading}
                />
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-white/40 pointer-events-none opacity-0 group-focus-within:opacity-100"
                  layoutId="input-focus"
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/90 flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <button
                  type="button"
                  className="text-sm text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  Mot de passe oublié?
                </button>
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-5 pr-14 bg-white/10 backdrop-blur-md border-2 border-white/20 text-white placeholder:text-white/40 focus:border-white/60 focus:bg-white/20 rounded-xl transition-all duration-300 text-base"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-2"
            >
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold rounded-xl bg-white text-red-600 hover:bg-white/95 shadow-xl shadow-black/20 transition-all duration-300 relative overflow-hidden group"
                  disabled={isLoading}
                >
                  {/* Effet de brillance au hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                  {isLoading ? (
                    <motion.div
                      className="flex items-center gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {/* Loader personnalisé roue de camion */}
                      <motion.div
                        className="w-6 h-6 border-3 border-red-600/30 border-t-red-600 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Connexion en cours...</span>
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-3 relative z-10">
                      <LogIn className="h-5 w-5" />
                      SE CONNECTER
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="pt-6 text-center"
          >
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} LOGISTIGA - Application privée
            </p>
            <p className="text-xs text-white/30 mt-1">
              Tous droits réservés
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Styles pour mobile */}
      <style>{`
        @media (max-width: 1023px) {
          .min-h-screen {
            background: linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%);
          }
        }
      `}</style>
    </div>
  );
});

export default LoginPage;
