"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, X, Mic, MicOff } from "lucide-react";

import { aiApi, ParsedTaskResponse } from "@/lib/api/ai";
import { tasksApi } from "@/lib/api/tasks";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface AITaskParserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AITaskParserDialog({ open, onOpenChange }: AITaskParserDialogProps) {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [parsedTask, setParsedTask] = useState<ParsedTaskResponse | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          toast.error("Voice input failed: " + event.error);
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
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to parse task");
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
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create task");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Task Parser
          </DialogTitle>
          <DialogDescription>
            Describe your task in natural language and let AI extract the details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Describe your task</label>
              <Button
                type="button"
                size="sm"
                variant={isListening ? "destructive" : "outline"}
                onClick={toggleVoiceInput}
                disabled={isLoading}
              >
                {isListening ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Voice Input
                  </>
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Example: 'Call dentist tomorrow at 3pm - very urgent'"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-25"
              disabled={isLoading || isListening}
            />
            <div className="text-xs text-muted-foreground">
              Examples:
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>"Meeting with Sarah about Q4 planning next Tuesday morning"</li>
                <li>"Fix authentication bug - high priority, work category"</li>
                <li>"Buy groceries tonight before 8pm"</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleParse}
              disabled={isLoading || !inputText.trim()}
              variant="outline"
              className="flex-1"
            >
              {parseMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Preview Parse
            </Button>
            <Button
              onClick={handleCreateDirectly}
              disabled={isLoading || !inputText.trim()}
              className="flex-1"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Directly
            </Button>
          </div>

          {/* Parsed Result */}
          {parsedTask && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Parsed Task Details
                  </h3>
                  <span className="text-xs px-2 py-1 bg-primary/10 rounded-full">
                    {Math.round(parsedTask.confidence * 100)}% confidence
                  </span>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Title
                  </label>
                  <p className="text-sm font-medium">{parsedTask.title}</p>
                </div>

                {/* Description */}
                {parsedTask.description && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-sm">{parsedTask.description}</p>
                  </div>
                )}

                {/* Due Date */}
                {parsedTask.due_date && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Due Date
                    </label>
                    <p className="text-sm">
                      {new Date(parsedTask.due_date).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        parsedTask.is_urgent
                          ? "bg-red-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm">
                      {parsedTask.is_urgent ? "Urgent" : "Not Urgent"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        parsedTask.is_important
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm">
                      {parsedTask.is_important ? "Important" : "Not Important"}
                    </span>
                  </div>
                </div>

                {/* Category */}
                {parsedTask.suggested_category && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Suggested Category
                    </label>
                    <p className="text-sm">{parsedTask.suggested_category}</p>
                  </div>
                )}

                {/* Tags */}
                {parsedTask.suggested_tags.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Suggested Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {parsedTask.suggested_tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create Button */}
                <Button
                  onClick={handleCreateFromParsed}
                  disabled={createMutation.isPending}
                  className="w-full mt-2"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Check className="mr-2 h-4 w-4" />
                  Confirm & Create Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
