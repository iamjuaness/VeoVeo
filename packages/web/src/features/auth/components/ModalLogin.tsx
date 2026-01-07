import type { User } from "@veoveo/shared";
import { useState } from "react";
import { login } from "../../movies/services/auth";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "../../../shared/components/ui/dialog";
import {
  LogIn,
  Sparkles,
  Mail,
  EyeOff,
  Eye,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "../../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/components/ui/card";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";

interface LoginDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onLogin: (user: User) => void;
  openRegisterModal: () => void;
}

export function ModalLogin({
  open,
  setOpen,
  onLogin,
  openRegisterModal,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await login({ email, password });
      const user = {
        id: result.id,
        name: result.name,
        email: result.email,
        avatar: result.avatar,
      };

      if (user) {
        onLogin(user);
        setOpen(false);
        window.location.reload();
      } else {
        setError("Error al iniciar sesión");
      }
    } catch (error: any) {
      setError(error?.message || "Error al iniciar sesión, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-2 border-border hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 font-semibold tracking-wide"
        >
          <LogIn className="w-4 h-4" />
          Iniciar Sesión
        </Button>
      </DialogTrigger>

      {/* FIX: Posicionamiento responsive correcto */}
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 overflow-hidden shadow-2xl border-border/50 max-h-[90vh] sm:max-h-[85vh] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] mx-auto">
        {/* Header gradient */}
        <div className="relative h-28 bg-linear-to-br from-primary via-primary/90 to-accent overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 gap-2">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <Sparkles className="w-8 h-8 text-primary-foreground drop-shadow-lg" />
            </div>
            <h2 className="text-xl font-black text-primary-foreground drop-shadow-md">
              Bienvenido de vuelta
            </h2>
          </div>
        </div>

        {/* Form Card */}
        <Card className="mx-6 mb-4 shadow-2xl border-card/50">
          <CardHeader className="pb-4 space-y-1 mt-2">
            <CardTitle className="text-2xl font-black text-center bg-linear-to-r from-foreground to-primary bg-clip-text text-transparent">
              Inicia Sesión
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground/90">
              Accede a tu cuenta para continuar viendo
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pb-8 space-y-4">
            {error && (
              <div className="p-4 rounded-2xl border-2 border-destructive/20 bg-destructive/5 group">
                <p className="text-sm font-medium text-destructive text-center">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-foreground/90"
                >
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="h-12 pl-12 pr-4 bg-card/50 border-border/50 hover:border-primary/50 focus-visible:ring-primary/50 focus-visible:border-primary/75 shadow-sm transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-foreground/90"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 pl-12 pr-12 bg-card/50 border-border/50 hover:border-primary/50 focus-visible:ring-primary/50 focus-visible:border-primary/75 shadow-sm transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-accent/50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center justify-between pt-2 pb-4">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs font-semibold text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  onClick={() => {
                    setOpen(false);
                    openRegisterModal();
                  }}
                  disabled={isLoading}
                >
                  Crear nueva cuenta
                </Button>
              </div>

              {/* Botones */}
              <DialogFooter className="gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 shadow-sm font-semibold transition-all duration-200"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 gap-2 rounded-xl bg-linear-to-r from-primary via-primary/90 to-accent shadow-xl hover:shadow-2xl hover:-translate-y-px active:translate-y-0 font-bold tracking-wide transition-all duration-300 border-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 shrink-0" />
                      Acceder
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
