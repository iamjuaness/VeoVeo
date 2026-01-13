import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../../shared/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/components/ui/avatar";
import { Button } from "../../../shared/components/ui/button";
import {
  LogOut,
  Sun,
  Moon,
  BarChart3,
  Settings,
  User as UserIcon,
  Users,
  ChevronRight,
} from "lucide-react";
import { Switch } from "../../../shared/components/ui/switch";
import { Separator } from "../../../shared/components/ui/separator";
import { predefinedAvatars } from "../../../shared/components/common/PredefinedAvatars";
import { ModalSettings } from "./ModalSettings";
import { useContext, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { ThemeContext } from "../../../core/providers/ThemeContext";

const APP_VERSION = "2.7.3"; // Update this when releasing new versions

interface UserMenuProps {
  open: boolean;
  setOpen(val: boolean): void;
}

export function UserMenu({ open, setOpen }: UserMenuProps) {
  const { user, setUser, logout } = useAuth();
  const userAvatarObj =
    predefinedAvatars.find((a) => a.id === user?.avatar) ||
    predefinedAvatars[0];
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  if (!user) return null;

  // Función para ir a estadísticas
  const goToStats = () => {
    if (user) {
      window.location.href = "/stats";
    }
    setOpen(false);
  };

  const goToSocial = () => {
    if (user) {
      window.location.href = "/social";
    }
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-12 w-12 rounded-full p-0 overflow-hidden border-2 border-primary/30 hover:border-primary transition-all hover:scale-110"
        >
          <Avatar className="h-full w-full">
            <AvatarImage
              src={userAvatarObj.url || "/placeholder.svg"}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-80 p-0 border-l border-border/50 bg-background/95 backdrop-blur-xl"
      >
        {/* Header con gradiente */}
        <div className="relative h-40 bg-linear-to-br from-primary/20 via-primary/10 to-background p-6 flex flex-col justify-end">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <UserIcon className="w-24 h-24 text-primary rotate-12" />
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
              <AvatarImage
                src={userAvatarObj.url || "/placeholder.svg"}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <h3 className="font-bold text-lg leading-none">{user.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Sección Principal */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Mi Cuenta
            </h4>

            <Button
              variant="ghost"
              className="w-full justify-between h-12 px-4 rounded-xl hover:bg-primary/5 group transition-all"
              onClick={goToStats}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-medium">Estadísticas</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-12 px-4 rounded-xl hover:bg-primary/5 group transition-all"
              onClick={goToSocial}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 text-green-600 rounded-lg group-hover:bg-green-500/20 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium">Social</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between h-12 px-4 rounded-xl hover:bg-primary/5 group transition-all"
              onClick={() => setShowSettingsModal(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-medium">Configuración</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <Separator className="bg-border/50" />

          {/* Sección Preferencias */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Preferencias
            </h4>

            <div className="flex items-center justify-between h-12 px-4 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "bg-orange-500/10 text-orange-500"
                  }`}
                >
                  {isDarkMode ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </div>
                <span className="font-medium">Modo Oscuro</span>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Footer / Logout */}
          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 px-4 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </Button>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground/50">
                CineMate v{APP_VERSION}
              </p>
            </div>
          </div>
        </div>

        <ModalSettings
          open={showSettingsModal}
          setOpen={setShowSettingsModal}
          user={user}
          setUser={setUser}
        />
      </SheetContent>
    </Sheet>
  );
}
