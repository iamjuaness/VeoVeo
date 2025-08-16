import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "./ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { LogOut, Sun, Moon, BarChart3 } from "lucide-react";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { predefinedAvatars } from "./PredefinedAvatars";
import { ModalSettings } from "./ModalSettings";
import { useContext, useState } from "react";
import { useAuth } from "../context/useAuth";
import { ThemeContext } from "../context/ThemeContext";

interface UserMenuProps {
  open: boolean;
  setOpen(val: boolean): void;
}

export function UserMenu({
  open,
  setOpen,
}: UserMenuProps) {
  const { user, setUser, logout } = useAuth();
  const userAvatarObj = predefinedAvatars.find((a) => a.id === user!.avatar)!;
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  if (!user) return null;

    // Función para ir a estadísticas
  const goToStats = () => {
    if (user) {
      window.location.href = "/stats"
    }
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="p-0 rounded-full pt-5">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage
              src={userAvatarObj.url || "/placeholder.svg"}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={userAvatarObj.url || "/placeholder.svg"}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <SheetTitle className="text-lg">{user.name}</SheetTitle>
              <SheetDescription className="text-sm">
                {user.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Separator className="my-6" />
        <ModalSettings
          open={showSettingsModal}
          setOpen={setShowSettingsModal}
          user={user}
          setUser={setUser}
        />
        {/* Estadísticas */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={goToStats}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Estadísticas</span>
        </Button>
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent">
          <div className="flex items-center gap-3">
            {isDarkMode ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            <span>Tema {isDarkMode ? "Oscuro" : "Claro"}</span>
          </div>
          <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
        </div>
        <Separator />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
