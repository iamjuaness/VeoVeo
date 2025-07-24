import type { User } from "../interfaces/User";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { ModalLogin } from "./ModalLogin";
import { ModalRegister } from "./ModalRegister";
import { Separator } from "./ui/separator";
import { Menu, Moon, Sun } from "lucide-react";
import { Switch } from "./ui/switch";

interface HamburgerProps {
  showMobileMenu: boolean;
  setShowMobileMenu: (val: boolean) => void;
  setUser: (user: User | null) => void;
  handleLogout: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  setShowLoginModal: (open: boolean) => void;
  showLoginModal: boolean;
  setShowRegisterModal: (open: boolean) => void;
  showRegisterModal: boolean;
}

export function Hamburger({
  showMobileMenu,
  setShowMobileMenu,
  setUser,
  toggleTheme,
  isDarkMode,
  showLoginModal,
  setShowLoginModal,
  showRegisterModal,
  setShowRegisterModal,
}: HamburgerProps) {
  return (
    <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden bg-transparent"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80" aria-describedby={undefined}>
        <div className="space-y-4 mt-12">
          {/* Botones de autenticación en móvil */}
          <div className="flex flex-col justify-between p-3 rounded-lg w-full max-w-xs mx-auto space-y-4">
            <ModalLogin
              open={showLoginModal}
              setOpen={setShowLoginModal}
              onLogin={setUser}
              openRegisterModal={() => setShowRegisterModal(true)}
            />
            <ModalRegister
              open={showRegisterModal}
              setOpen={setShowRegisterModal}
            />
          </div>

          <Separator />

          {/* Toggle de tema en el menú móvil */}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
