import { Button } from "../ui/button";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "../ui/separator";
import { Menu, Film, Tv, LogIn, UserPlus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { User } from "../../../interfaces/User";

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

export function Hamburger(props: HamburgerProps) {
  const { user } = useAuth();
  const closeMenu = () => props.setShowMobileMenu(false);

  return (
    <>
      <div className="relative z-50">
        <Sheet
          open={props.showMobileMenu}
          onOpenChange={props.setShowMobileMenu}
        >
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden bg-transparent hover:bg-accent/50"
              aria-label="Abrir menú móvil"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-80 sm:w-96 p-0 shadow-2xl border-l-border/50 bg-linear-to-b from-background/95 via-card/90 to-background backdrop-blur-2xl"
          >
            <SheetHeader className="hidden">
              <SheetTitle></SheetTitle>
              <SheetDescription></SheetDescription>
            </SheetHeader>
            {/* Header profesional */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 pb-6 sticky top-0 bg-linear-to-b from-card/95 to-transparent backdrop-blur-xl border-b-border/30 z-20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-primary/20 to-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <Film className="h-6 w-6 text-primary drop-shadow-sm" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black bg-linear-to-r from-foreground via-primary to-primary bg-clip-text text-transparent drop-shadow-lg">
                      CineMate
                    </h1>
                    <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                      Películas y Series
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navegación con animaciones */}
            {user && (
              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 pb-4 space-y-1"
              >
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full h-16 group justify-start gap-4 rounded-2xl hover:bg-linear-to-r hover:from-accent/30 hover:to-primary/10 hover:text-foreground transition-all duration-300 hover:scale-[1.02] active:scale-100"
                    onClick={() => {
                      window.location.href = "/home";
                      closeMenu();
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted/50 group-hover:bg-accent/50 flex items-center justify-center transition-all duration-300">
                      <Film className="h-6 w-6 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-lg font-semibold block">
                        Películas
                      </span>
                      <span className="text-xs text-muted-foreground font-medium tracking-wide">
                        Novedades y Tendencias
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground ml-auto transition-transform group-hover:translate-x-1" />
                  </Button>
                </SheetClose>

                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full h-16 group justify-start gap-4 rounded-2xl hover:bg-linear-to-r hover:from-accent/30 hover:to-primary/10 hover:text-foreground transition-all duration-300 hover:scale-[1.02] active:scale-100"
                    onClick={() => {
                      window.location.href = "/series";
                      closeMenu();
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted/50 group-hover:bg-accent/50 flex items-center justify-center transition-all duration-300">
                      <Tv className="h-6 w-6 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-lg font-semibold block">
                        Series
                      </span>
                      <span className="text-xs text-muted-foreground font-medium tracking-wide">
                        Temporadas completas
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground ml-auto transition-transform group-hover:translate-x-1" />
                  </Button>
                </SheetClose>
              </motion.nav>
            )}

            <Separator className="border-border/50 mx-6" />

            {/* CTAs profesionales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 pt-4 space-y-3"
            >
              <SheetClose asChild>
                <Button
                  size="lg"
                  className="w-full h-14 px-6 gap-3 shadow-2xl rounded-2xl bg-linear-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground transform hover:shadow-3xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 border-0"
                  onClick={() => {
                    props.setShowLoginModal(true);
                    closeMenu();
                  }}
                >
                  <LogIn className="h-5 w-5 shrink-0" />
                  <span className="font-semibold tracking-wide">
                    Iniciar Sesión
                  </span>
                </Button>
              </SheetClose>

              <SheetClose asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-14 px-6 gap-3 border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 rounded-2xl text-foreground font-semibold transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => {
                    props.setShowRegisterModal(true);
                    closeMenu();
                  }}
                >
                  <UserPlus className="h-5 w-5 shrink-0" />
                  <span className="tracking-wide">Registrarse</span>
                </Button>
              </SheetClose>
            </motion.div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
