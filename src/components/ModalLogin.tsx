import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "@radix-ui/react-label";
import  { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LogIn } from "lucide-react";
import { login } from "../api/auth";
import type { User } from "../interfaces/User";


interface LoginDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onLogin: (user: User) => void;
  openRegisterModal: () => void;
}

export function ModalLogin({ open, setOpen, onLogin, openRegisterModal }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    const user = { id: result.id, name: result.name, email: result.email, avatar: result.avatar };
    if (user) {
      onLogin(user);
      setOpen(false);
      window.location.reload();
    } else {
      alert("Error al iniciar sesión");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
            </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Sesión</DialogTitle>
          <DialogDescription>
            Ingresa tus credenciales para acceder a tu cuenta
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="link" className="p-0 h-auto text-sm">
              ¿Olvidaste tu contraseña?
            </Button>
            <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => {
              setOpen(false);     
              openRegisterModal();
            }}
          >
            Crear cuenta
          </Button>
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
            <Button type="submit" className="flex-1">
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
