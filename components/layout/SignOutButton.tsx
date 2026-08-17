import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/logout";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    </form>
  );
}