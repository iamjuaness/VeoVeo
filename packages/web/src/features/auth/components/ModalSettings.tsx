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
import { User as UserIcon, Bell, Shield, Palette } from "lucide-react";
import { useState } from "react";
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
  const userAvatarObj = predefinedAvatars.find((a) => a.id === user.avatar)!;
  const [editingProfile, setEditingProfile] = useState<User>({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({
        ...user,
        name: editingProfile.name,
        email: editingProfile.email,
        avatar: editingProfile.avatar,
      });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl h-[60vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Personaliza tu cuenta y preferencias
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="w-full sha">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2 s">
              <UserIcon className="w-4 h-4" />
              <span className="sm:inline hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2" disabled>
              <Bell className="w-4 h-4" />
              <span className="sm:inline hidden">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2" disabled>
              <Shield className="w-4 h-4" />
              <span className="sm:inline hidden">Privacidad</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2" disabled>
              <Palette className="w-4 h-4" />
              <span className="sm:inline hidden">Apariencia</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-full">
                  <AvatarImage
                    src={userAvatarObj.url || "/placeholder.svg"}
                    alt={user.name}
                    className="object-cover rounded-full h-12 w-12"
                  />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button type="button" variant="outline" size="sm" disabled>
                    Cambiar Avatar
                  </Button>
                </div>
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
                  disabled
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
                  disabled
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por email</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones sobre nuevas películas
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones push</p>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre películas en tu lista
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recomendaciones semanales</p>
                  <p className="text-sm text-muted-foreground">
                    Sugerencias personalizadas cada semana
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Perfil público</p>
                  <p className="text-sm text-muted-foreground">
                    Permite que otros vean tu perfil
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mostrar actividad</p>
                  <p className="text-sm text-muted-foreground">
                    Comparte qué películas has visto
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Análisis de datos</p>
                  <p className="text-sm text-muted-foreground">
                    Ayuda a mejorar las recomendaciones
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tema oscuro</p>
                  <p className="text-sm text-muted-foreground">
                    Cambia la apariencia de la aplicación
                  </p>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <select className="w-full p-2 border rounded-md">
                  <option>Español</option>
                  <option>English</option>
                  <option>Français</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Región</Label>
                <select className="w-full p-2 border rounded-md">
                  <option>España</option>
                  <option>México</option>
                  <option>Argentina</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
