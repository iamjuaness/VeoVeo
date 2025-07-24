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
import { LogOut, Settings, Sun, Moon } from "lucide-react";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { predefinedAvatars } from "./PredefinedAvatars";

interface UserMenuProps {
  user: { id: string; name: string; email: string; avatar: string };
  logout(): void;
  open: boolean;
  setOpen(val: boolean): void;
  isDarkMode: boolean;
  setIsDarkMode(val: boolean): void;
}

export function UserMenu({ user, logout, open, setOpen, isDarkMode, setIsDarkMode }: UserMenuProps) {

  const userAvatarObj = predefinedAvatars.find((a) => a.id === user.avatar)!;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="p-0 rounded-full pt-5">
          <Avatar className="h-15 w-15">
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
        <Button variant="ghost" className="w-full justify-start gap-3 h-12">
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
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
          <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
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
