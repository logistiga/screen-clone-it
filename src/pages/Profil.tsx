import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Shield, Lock, Eye, EyeOff, Save, 
  Loader2, CheckCircle2, Calendar, AlertTriangle, KeyRound,
  Camera, Trash2, Upload
} from "lucide-react";
import { useProfile, useUpdateProfile, useUpdatePassword, useUploadAvatar, useDeleteAvatar } from "@/hooks/use-users";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ProfilPage() {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("informations");
  
  // Formulaire informations
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [profileFormDirty, setProfileFormDirty] = useState(false);
  
  // Formulaire mot de passe
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Initialiser le formulaire avec les données du profil
  useState(() => {
    if (profile) {
      setProfileForm({
        name: profile.name,
        email: profile.email,
      });
    }
  });

  // Mettre à jour le formulaire quand le profil change
  if (profile && !profileFormDirty && (profileForm.name !== profile.name || profileForm.email !== profile.email)) {
    setProfileForm({
      name: profile.name,
      email: profile.email,
    });
  }

  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "U";
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) return;
    
    await updateProfile.mutateAsync({
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    });
    setProfileFormDirty(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
      return;
    }
    
    if (passwordForm.password !== passwordForm.password_confirmation) {
      return;
    }
    
    if (passwordForm.password.length < 8) {
      return;
    }
    
    await updatePassword.mutateAsync(passwordForm);
    
    // Réinitialiser le formulaire après succès
    setPasswordForm({
      current_password: '',
      password: '',
      password_confirmation: '',
    });
  };

  const isPasswordFormValid = () => {
    return (
      passwordForm.current_password.length > 0 &&
      passwordForm.password.length >= 8 &&
      passwordForm.password === passwordForm.password_confirmation
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    await uploadAvatar.mutateAsync(file);
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    await deleteAvatar.mutateAsync();
  };

  const formatDate = (date: string): string => {
    return format(new Date(date), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  if (isLoadingProfile) {
    return (
      <MainLayout title="Mon Profil">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout title="Mon Profil">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Impossible de charger le profil</h3>
              <p className="text-muted-foreground">
                Une erreur s'est produite lors du chargement de vos informations.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Mon Profil">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* En-tête du profil */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
            <CardContent className="relative pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
                {/* Avatar avec bouton de modification */}
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile?.name || "Utilisateur"} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {getInitials(profile?.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Overlay pour modifier la photo */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    {uploadAvatar.isPending ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {/* Bouton supprimer si une photo existe */}
                  {profile.avatar_url && !uploadAvatar.isPending && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleDeleteAvatar}
                      disabled={deleteAvatar.isPending}
                    >
                      {deleteAvatar.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  {/* Input fichier caché */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                
                <div className="flex-1 text-center sm:text-left sm:pb-2">
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                    {profile.roles[0] && (
                      <Badge variant="secondary" className="gap-1 capitalize">
                        <Shield className="h-3 w-3" />
                        {profile.roles[0].name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Upload className="h-3 w-3 inline-block mr-1" />
                    Survolez la photo pour la modifier (max 5 Mo)
                  </p>
                </div>
                {profile.email_verified_at && (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-3 w-3" />
                    Email vérifié
                  </Badge>
                )}
              </div>

              {/* Informations supplémentaires */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Compte créé le</p>
                    <p className="font-medium">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Permissions</p>
                    <p className="font-medium">{profile.permissions?.length || 0} autorisations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="informations" className="gap-2">
                <User className="h-4 w-4" />
                Informations
              </TabsTrigger>
              <TabsTrigger value="securite" className="gap-2">
                <Lock className="h-4 w-4" />
                Sécurité
              </TabsTrigger>
            </TabsList>

            {/* Tab: Informations personnelles */}
            <TabsContent value="informations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Informations personnelles
                  </CardTitle>
                  <CardDescription>
                    Modifiez vos informations de profil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, name: e.target.value });
                          setProfileFormDirty(true);
                        }}
                        placeholder="Votre nom complet"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, email: e.target.value });
                          setProfileFormDirty(true);
                        }}
                        placeholder="votre@email.com"
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!profileFormDirty || !profileForm.name.trim() || !profileForm.email.trim() || updateProfile.isPending}
                        className="gap-2"
                      >
                        {updateProfile.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Enregistrer les modifications
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Sécurité (mot de passe) */}
            <TabsContent value="securite" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <KeyRound className="h-5 w-5 text-primary" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription>
                    Pour votre sécurité, choisissez un mot de passe fort d'au moins 8 caractères
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          placeholder="Votre mot de passe actuel"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="password">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                          placeholder="Minimum 8 caractères"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordForm.password && passwordForm.password.length < 8 && (
                        <p className="text-sm text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Le mot de passe doit contenir au moins 8 caractères
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Confirmer le nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="password_confirmation"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.password_confirmation}
                          onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                          placeholder="Confirmer le mot de passe"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {passwordForm.password && passwordForm.password_confirmation && 
                       passwordForm.password !== passwordForm.password_confirmation && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                      {passwordForm.password && passwordForm.password_confirmation && 
                       passwordForm.password === passwordForm.password_confirmation && 
                       passwordForm.password.length >= 8 && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Les mots de passe correspondent
                        </p>
                      )}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={!isPasswordFormValid() || updatePassword.isPending}
                        className="gap-2"
                      >
                        {updatePassword.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        Changer le mot de passe
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Conseils de sécurité */}
              <Card className="mt-4 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200">Conseils de sécurité</h4>
                      <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• Utilisez un mot de passe unique pour ce compte</li>
                        <li>• Combinez lettres, chiffres et caractères spéciaux</li>
                        <li>• Ne partagez jamais votre mot de passe</li>
                        <li>• Changez régulièrement votre mot de passe</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}
