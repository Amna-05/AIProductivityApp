"use client";

import { useState } from "react";
import { Sparkles, Brain, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AITaskParserDialog } from "@/components/ai/AITaskParserDialog";

export default function AIPage() {
  const [parserDialogOpen, setParserDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Powered by AI to help you manage tasks more efficiently
          </p>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Task Parser */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Natural Language Task Creator</CardTitle>
                <CardDescription>Create tasks from plain text</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe your task in everyday language, and AI will automatically extract:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
              <li>Task title and description</li>
              <li>Due date and time</li>
              <li>Priority levels (urgent/important)</li>
              <li>Suggested category and tags</li>
            </ul>
            <Button onClick={() => setParserDialogOpen(true)} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Try AI Task Parser
            </Button>
          </CardContent>
        </Card>

        {/* AI Priority Suggestions */}
        <Card className="hover:shadow-lg transition-shadow opacity-75">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Smart Priority Suggestions</CardTitle>
                <CardDescription>AI-powered task prioritization</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get intelligent priority recommendations based on:
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
              <li>Similar completed tasks</li>
              <li>Historical patterns</li>
              <li>Due date proximity</li>
              <li>Task complexity analysis</li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              <Lightbulb className="mr-2 h-4 w-4" />
              Available in Task View
            </Button>
          </CardContent>
        </Card>

        {/* Task Analytics */}
        <Card className="hover:shadow-lg transition-shadow opacity-75 md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Task Analytics & Insights</CardTitle>
                <CardDescription>
                  Understand your productivity patterns
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI-powered analytics to help you work smarter:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Completion rate trends</li>
                <li>Priority distribution analysis</li>
                <li>Category breakdown</li>
              </ul>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Overdue task patterns</li>
                <li>Average completion time</li>
                <li>Productivity recommendations</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Lightbulb className="mr-2 h-4 w-4" />
              Coming Soon - Analytics Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* How It Works Section */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>How AI Task Parser Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <h3 className="font-semibold">Describe Your Task</h3>
              <p className="text-sm text-muted-foreground">
                Type or speak your task in natural language - no special format needed
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <h3 className="font-semibold">AI Extracts Details</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your input and identifies key task attributes
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <h3 className="font-semibold">Review & Create</h3>
              <p className="text-sm text-muted-foreground">
                Preview the parsed task, make any adjustments, and create it
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Task Parser Dialog */}
      <AITaskParserDialog
        open={parserDialogOpen}
        onOpenChange={setParserDialogOpen}
      />
    </div>
  );
}
