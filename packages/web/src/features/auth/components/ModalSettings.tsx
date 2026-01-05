import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../../shared/components/ui/avatar";
import { Label } from "../../../shared/components/ui/label";
import { User as UserIcon, Bell, Shield, Palette, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../shared/components/ui/tabs";
import type { User } from "../../../interfaces/User";
import { Switch } from "../../../shared/components/ui/switch";
import { predefinedAvatars } from "../../../shared/components/common/PredefinedAvatars";
import {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
} from "../../../shared/services/userService";

interface SettingsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: User;
  setUser: (user: User) => void;
}

export function ModalSettings({
  open,
  setOpen,
  user,
  setUser,
}: SettingsDialogProps) {
  const [editingProfile, setEditingProfile] = useState<User>({ ...user });
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);
  const [loading, setLoading] = useState(false);

  // States for preferences
  const [notifications, setNotifications] = useState({
    email: false,
    push: false,
    weekly: true,
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: false,
    showActivity: true,
    dataAnalytics: true,
  });
  const [appearance, setAppearance] = useState({
    theme: (document.documentElement.classList.contains("dark")
      ? "dark"
      : "light") as "light" | "dark",
    language: "Español",
    region: "España",
  });

  useEffect(() => {
    if (open) {
      loadProfileData();
    }
  }, [open]);

  const loadProfileData = async () => {
    try {
      const fullUser = await getUserProfile();
      setEditingProfile(fullUser);
      if (fullUser.notificationPreferences)
        setNotifications(fullUser.notificationPreferences);
      if (fullUser.privacyPreferences) setPrivacy(fullUser.privacyPreferences);
      if (fullUser.appearancePreferences)
        setAppearance(fullUser.appearancePreferences);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const currentAvatar =
    predefinedAvatars.find((a) => a.id === editingProfile.avatar) ||
    predefinedAvatars[0];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateUserProfile({
        name: editingProfile.name,
        email: editingProfile.email,
        bio: editingProfile.bio,
        selectedAvatar: editingProfile.avatar,
      });
      setUser(updated);
      setOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const updated = await updateUserSettings({
        notificationPreferences: notifications,
        privacyPreferences: privacy,
        appearancePreferences: appearance,
      });
      setUser(updated);
      // Theme reflects immediately
      if (appearance.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Personaliza tu cuenta y preferencias
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <UserIcon className="w-4 h-4" />
              <span className="sm:inline hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="sm:inline hidden">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="sm:inline hidden">Privacidad</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="sm:inline hidden">Apariencia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage
                      src={currentAvatar.url}
                      alt={editingProfile.name}
                      className="object-cover"
                    />
                    <AvatarFallback>{editingProfile.name[0]}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAvatarGrid(!showAvatarGrid)}
                  >
                    {showAvatarGrid ? "Cerrar" : "Cambiar Avatar"}
                  </Button>
                </div>

                {showAvatarGrid && (
                  <div className="grid grid-cols-5 gap-2 p-4 border rounded-lg bg-muted/50">
                    {predefinedAvatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                          setEditingProfile({
                            ...editingProfile,
                            avatar: avatar.id,
                          });
                          setShowAvatarGrid(false);
                        }}
                        className={`relative rounded-full overflow-hidden border-2 transition-all ${
                          editingProfile.avatar === avatar.id
                            ? "border-primary scale-110 shadow-lg"
                            : "border-transparent hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.id}
                          className="w-full h-full object-cover"
                        />
                        {editingProfile.avatar === avatar.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre completo</Label>
                <Input
                  id="edit-name"
                  value={editingProfile.name}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      name: e.target.value,
                    })
                  }
                  placeholder="Tu nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingProfile.email}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      email: e.target.value,
                    })
                  }
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bio">Biografía</Label>
                <textarea
                  id="edit-bio"
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editingProfile.bio || ""}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      bio: e.target.value,
                    })
                  }
                  placeholder="Cuéntanos algo sobre ti..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Perfil"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por email</p>
                  <p className="text-sm text-muted-foreground">
                    Actualizaciones sobre nuevas películas
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(v) =>
                    setNotifications({ ...notifications, email: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones push</p>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre tus listas
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(v) =>
                    setNotifications({ ...notifications, push: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recomendaciones semanales</p>
                  <p className="text-sm text-muted-foreground">
                    Sugerencias personalizadas
                  </p>
                </div>
                <Switch
                  checked={notifications.weekly}
                  onCheckedChange={(v) =>
                    setNotifications({ ...notifications, weekly: v })
                  }
                />
              </div>
              <Button
                onClick={saveSettings}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Perfil público</p>
                  <p className="text-sm text-muted-foreground">
                    Permite que otros vean tu perfil
                  </p>
                </div>
                <Switch
                  checked={privacy.publicProfile}
                  onCheckedChange={(v) =>
                    setPrivacy({ ...privacy, publicProfile: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar actividad</p>
                  <p className="text-sm text-muted-foreground">
                    Comparte qué has visto
                  </p>
                </div>
                <Switch
                  checked={privacy.showActivity}
                  onCheckedChange={(v) =>
                    setPrivacy({ ...privacy, showActivity: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Análisis de datos</p>
                  <p className="text-sm text-muted-foreground">
                    Mejora las sugerencias
                  </p>
                </div>
                <Switch
                  checked={privacy.dataAnalytics}
                  onCheckedChange={(v) =>
                    setPrivacy({ ...privacy, dataAnalytics: v })
                  }
                />
              </div>
              <Button
                onClick={saveSettings}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Privacidad"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tema oscuro</p>
                  <p className="text-sm text-muted-foreground">
                    Cambia la apariencia visual
                  </p>
                </div>
                <Switch
                  checked={appearance.theme === "dark"}
                  onCheckedChange={(v) =>
                    setAppearance({
                      ...appearance,
                      theme: v ? "dark" : "light",
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={appearance.language}
                  onChange={(e) =>
                    setAppearance({ ...appearance, language: e.target.value })
                  }
                >
                  <option>Español</option>
                  <option>English</option>
                  <option>Français</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Región</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={appearance.region}
                  onChange={(e) =>
                    setAppearance({ ...appearance, region: e.target.value })
                  }
                >
                  <option>España</option>
                  <option>México</option>
                  <option>Argentina</option>
                  <option>Colombia</option>
                </select>
              </div>
              <Button
                onClick={saveSettings}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Apariencia"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
