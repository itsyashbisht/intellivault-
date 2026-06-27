"use client";

import React, { useState } from "react";
import { procesPDfFile } from "@/app/upload/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function PDFUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const result = await procesPDfFile(formData);
      if (result.success) {
        setMessage({
          type: "success",
          text: result.message || "PDF processed success",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "PDF processed failed",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "An error has occurred while processing the PDF file.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
          PDF Upload
        </h1>

        <Card className="mb-6">
          <CardContent className="pt-5">
            <div className="space-y-4">
              <Label htmlFor="pdf-upload">Upload PDF file</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="mt-2"
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-muted-foreground">Processing PDF...</span>
              </div>
            )}

            {message && (
              <Alert
                variant={message.type === "error" ? "destructive" : "default"}
              >
                <AlertTitle>
                  {message.type === "error" ? "Error!" : "Success!"}
                </AlertTitle>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
