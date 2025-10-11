'use client'

import { useState } from "react"
import { createQuestion } from "./actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NewQuestionPage() {
  const [options, setOptions] = useState(["", ""])
  const [correctOption, setCorrectOption] = useState(0)

  const addOption = () => {
    setOptions([...options, ""])
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Question</CardTitle>
          <CardDescription>
            Fill out the form to add a new question to the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createQuestion} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input name="subject" id="subject" placeholder="e.g., Direito Administrativo" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="statement">Question Statement</Label>
              <textarea
                name="statement"
                id="statement"
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter the question statement here..."
              />
            </div>

            <div className="grid gap-4">
              <Label>Answer Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOptionIndex"
                    value={index}
                    checked={correctOption === index}
                    onChange={() => setCorrectOption(index)}
                    className="h-4 w-4"
                  />
                  <Input
                    name={`option_${index}`}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addOption} className="w-fit">
                Add Option
              </Button>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="explanation">Explanation</Label>
              <textarea
                name="explanation"
                id="explanation"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Explain why the correct answer is right."
              />
            </div>

            <Button type="submit" className="w-full">Save Question</Button>
          </form>
        </CardContent>
      </Card>
    </div>
) }