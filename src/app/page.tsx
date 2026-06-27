import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === "admin";

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            IntelliVault
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAdmin
              ? "Upload PDFs to your knowledge vault, then chat with an intelligent assistant that searches your documents for answers."
              : "Chat with an intelligent assistant that searches the knowledge vault for answers."}
          </p>
        </div>

        <div
          className={
            isAdmin ? "grid gap-4 sm:grid-cols-2" : "mx-auto w-full max-w-md"
          }
        >
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Add PDF files to build your searchable knowledge base.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/upload">Go to Upload</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>
                Ask questions and get answers grounded in the knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="secondary">
                <Link href="/chat">Start Chatting</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
