import Link from "next/link";
import { Show, SignInButton, SignOutButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  return (
    <nav className="border-b border-border bg-background">
      <div className="flex container h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="text-xl font-semibold text-foreground">
          IntelliVault
        </Link>

        <div className="flex gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Sign Up</Button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <SignOutButton>
              <Button variant="outline">Sign Out</Button>
            </SignOutButton>
          </Show>
        </div>
      </div>
    </nav>
  );
};
