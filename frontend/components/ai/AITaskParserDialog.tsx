"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, X, Mic, MicOff } from "lucide-react";

import { aiApi, ParsedTaskResponse } from "@/lib/api/ai";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Type definition for Web Speech API
interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface AITaskParserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// User-friendly speech recognition error messages
const getSpeechErrorMessage = (error: string): string => {
  const messages: Record<string, string> = {
    "no-speech": "No speech detected. Please speak louder or closer to your microphone.",
    "audio-capture": "Microphone not found. Please check your audio settings.",
    "not-allowed": "Microphone access denied. Please allow microphone access in your browser settings.",
    "network": "Network error. Please check your internet connection.",
    "aborted": "Voice input was cancelled.",
    "service-not-allowed": "Speech service is unavailable in your browser.",
    "bad-grammar": "Could not understand. Please try speaking more clearly.",
  };
  return messages[error] || "Voice input failed. Please try again.";
};

export function AITaskParserDialog({ open, onOpenChange }: AITaskParserDialogProps) {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [parsedTask, setParsedTask] = useState<ParsedTaskResponse | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const windowWithSpeech = window as typeof window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
      const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as SpeechRecognitionType;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
          setIsListening(false);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          toast.error(getSpeechErrorMessage(event.error));
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening... Speak your task");
      } catch (error) {
        console.error("Failed to start recognition:", error);
        toast.error("Failed to start voice input");
      }
    }
  };

  // Parse task mutation
  const parseMutation = useMutation({
    mutationFn: aiApi.parseTask,
    onSuccess: (data) => {
      setParsedTask(data);
      toast.success("Task parsed successfully!");
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to parse task");
    },
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: aiApi.createFromVoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully!");
      handleClose();
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || "Failed to create task");
    },
  });

  const handleParse = () => {
    if (!inputText.trim()) {
      toast.error("Please enter a task description");
      return;
    }
    parseMutation.mutate({ text: inputText });
  };

  const handleCreateDirectly = () => {
    if (!inputText.trim()) {
      toast.error("Please enter a task description");
      return;
    }
    createMutation.mutate({ text: inputText });
  };

  const handleCreateFromParsed = () => {
    if (!parsedTask) return;
    createMutation.mutate({ text: parsedTask.original_input });
  };

  const handleClose = () => {
    setInputText("");
    setParsedTask(null);
    onOpenChange(false);
  };

  const isLoading = parseMutation.isPending || createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          {/* ELEVATE AI Parser Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center font-bold text-foreground">AI Task Parser</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Describe your task in natural language and let AI extract the details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Your Task</label>
              <Button
                type="button"
                size="sm"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleVoiceInput}
                disabled={isLoading}
                className="font-medium"
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Voice
                  </>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Example: 'Buy groceries tomorrow at 5pm, high priority'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px] p-4 rounded-lg text-base"
              disabled={isLoading || isListening}
            />
            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <strong>Try these examples:</strong>
              <ul className="mt-2 space-y-1">
                <li>• &apos;Meeting with Sarah about Q4 planning next Tuesday morning&apos;</li>
                <li>• &apos;Fix authentication bug - high priority, work category&apos;</li>
                <li>• &apos;Buy groceries tonight before 8pm&apos;</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          {!parsedTask && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleParse}
                disabled={isLoading || !inputText.trim()}
                variant="outline"
                className="flex-1 h-11 font-medium"
              >
                {parseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Preview Parse
              </Button>
              <Button
                onClick={handleCreateDirectly}
                disabled={isLoading || !inputText.trim()}
                className="flex-1 h-11 font-medium"
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Sparkles className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedTask && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Check className="h-5 w-5 text-success" />
                  Parsed Task Preview
                </h3>
                <span className="text-xs px-3 py-1 bg-success/10 text-success rounded-full font-semibold">
                  {Math.round(parsedTask.confidence * 100)}% confident
                </span>
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Title
                  </label>
                  <p className="text-base font-semibold text-foreground mt-1">{parsedTask.title}</p>
                </div>

                {/* Description */}
                {parsedTask.description && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Description
                    </label>
                    <p className="text-sm text-foreground mt-1">{parsedTask.description}</p>
                  </div>
                )}

                {/* Due Date & Priority Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Due Date */}
                  {parsedTask.due_date && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Due Date
                      </label>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {new Date(parsedTask.due_date).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Priority Badges */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          parsedTask.is_urgent
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {parsedTask.is_urgent ? "Urgent" : "Not Urgent"}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          parsedTask.is_important
                            ? "bg-warning/10 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {parsedTask.is_important ? "Important" : "Not Important"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category */}
                {parsedTask.suggested_category && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Suggested Category
                    </label>
                    <p className="text-sm font-medium text-foreground mt-1">{parsedTask.suggested_category}</p>
                  </div>
                )}

                {/* Tags */}
                {parsedTask.suggested_tags.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Suggested Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {parsedTask.suggested_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setParsedTask(null)}
                  variant="outline"
                  className="flex-1 h-11 font-medium text-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Edit Input
                </Button>
                <Button
                  onClick={handleCreateFromParsed}
                  disabled={createMutation.isPending}
                  className="flex-1 h-11 font-medium"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Check className="mr-2 h-4 w-4" />
                  Confirm & Create
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
