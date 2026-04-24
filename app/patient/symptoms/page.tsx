'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'

interface AnalysisResult {
  possibleConditions: string[]
  severity: 'mild' | 'moderate' | 'severe'
  recommendations: string[]
  disclaimer: string
}

export default function SymptomAnalyzerPage() {
  const [symptoms, setSymptoms] = useState('')
  const [duration, setDuration] = useState('')
  const [severity, setSeverity] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms')
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, duration, severity }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)

      // Save the analysis to the database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase.from('symptom_analyses').insert({
          patient_id: user.id,
          symptoms: symptoms.split(/[\s,]+/).filter(Boolean),
          severity: data.severity === 'severe' ? 'major' : data.severity === 'mild' ? 'minor' : 'moderate',
          analysis_result: data,
          recommended_action: data.recommendations?.[0] || null,
        })
      }

      toast.success('Analysis complete')
    } catch {
      toast.error('Failed to analyze symptoms. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'mild':
        return 'bg-green-100 text-green-800'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800'
      case 'severe':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Symptom Analyzer</h1>
        <p className="mt-1 text-muted-foreground">
          Get preliminary insights about your symptoms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.brain className="h-5 w-5 text-primary" />
              Describe Your Symptoms
            </CardTitle>
            <CardDescription>
              Provide detailed information for better analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze}>
              <FieldGroup>
                <Field>
                  <FieldLabel>What symptoms are you experiencing?</FieldLabel>
                  <Textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe your symptoms in detail (e.g., headache, fever, fatigue, cough...)"
                    rows={5}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel>How long have you had these symptoms?</FieldLabel>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less_than_day">
                        Less than a day
                      </SelectItem>
                      <SelectItem value="1_3_days">1-3 days</SelectItem>
                      <SelectItem value="4_7_days">4-7 days</SelectItem>
                      <SelectItem value="1_2_weeks">1-2 weeks</SelectItem>
                      <SelectItem value="more_than_2_weeks">
                        More than 2 weeks
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>How severe are your symptoms?</FieldLabel>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">
                        Mild - Noticeable but not affecting daily activities
                      </SelectItem>
                      <SelectItem value="moderate">
                        Moderate - Affecting some daily activities
                      </SelectItem>
                      <SelectItem value="severe">
                        Severe - Significantly impacting daily life
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isAnalyzing || !symptoms.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <Icons.refresh className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Icons.brain className="mr-2 h-4 w-4" />
                      Analyze Symptoms
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Analysis Results
                    <Badge className={getSeverityColor(result.severity)}>
                      {result.severity.toUpperCase()} Risk
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="mb-2 font-semibold">Possible Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.possibleConditions.map((condition, i) => (
                        <Badge key={i} variant="secondary">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold">Recommendations</h4>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Icons.checkCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Icons.alertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">
                        Important Disclaimer
                      </p>
                      <p className="mt-1 text-sm text-yellow-700">
                        {result.disclaimer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex h-full items-center justify-center">
              <CardContent className="py-12 text-center">
                <Icons.brain className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Describe your symptoms and click analyze to get AI-powered
                  insights
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
