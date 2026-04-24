import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { symptoms, duration, severity } = await req.json()

    if (!symptoms?.trim()) {
      return NextResponse.json({ error: 'Symptoms are required' }, { status: 400 })
    }

    const prompt = `You are a medical information assistant. A patient has described symptoms and needs a preliminary analysis. Respond with valid JSON only — no markdown, no text outside the JSON object.

Patient information:
- Symptoms: ${symptoms}
- Duration: ${duration || 'not specified'}
- Self-reported severity: ${severity || 'not specified'}

Respond with exactly this JSON structure:
{
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "severity": "mild",
  "recommendations": ["step1", "step2", "step3"],
  "disclaimer": "one sentence disclaimer"
}

Rules:
- possibleConditions: list 2-4 plausible conditions based on the symptoms
- severity: must be exactly "mild", "moderate", or "severe"
- recommendations: 3-4 practical steps the patient can take right now
- disclaimer: remind the patient this is not a diagnosis and to consult a doctor
- Return only the JSON object, nothing else`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512,
    })

    const content = completion.choices[0]?.message?.content || ''

    // Extract JSON — model sometimes wraps in markdown code blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (error) {
    console.error('Symptom analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze symptoms. Please try again.' },
      { status: 500 }
    )
  }
}
