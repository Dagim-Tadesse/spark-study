import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const { signIn } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter any email to continue in this local auth flow.
        </p>
        <div className="mt-4 space-y-3">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
          />
          <Button type="button" className="w-full" onClick={() => signIn(email)}>
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}
