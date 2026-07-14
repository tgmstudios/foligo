/**
 * POST /api/resume/documents/:id/score
 *
 * Scores a resume using the HackerRank Hiring Agent rubric
 * (https://github.com/interviewstreet/hiring-agent).
 *
 * Categories (100 points):
 *   Open Source:          35 max
 *   Self Projects:        30 max
 *   Production Experience: 25 max
 *   Technical Skills:      10 max
 *
 * Bonus: max +20 (GSoC, startup founder, early engineer, portfolio, LinkedIn, blog)
 * Deductions: variable (simple projects, no links, broken links, classroom-only)
 * Cap: 120
 */

const { prisma } = require('../services/core/database');
const ai = require('../services/ai/manager');

const SCORING_SYSTEM = `You are an expert resume evaluator following the HackerRank Hiring Agent scoring system.

## Scoring Rubric

### Category 1: Open Source Contributions (max 35 points)
- Contributions to famous repos (1000+ stars): 25-35 pts
- Smaller open source projects with meaningful PRs: 15-24 pts
- Only personal repos, no external contributions: 5-10 pts
- No GitHub/open source presence: 0-4 pts
- CRITICAL RULE: Personal repos are NOT open source. Must be contributions to OTHER people's projects.
- If all repos are self-project type, cap at 10.

### Category 2: Self Projects (max 30 points)
- Full-stack apps, ML/AI, real-time apps, microservices, significant user adoption: 20-30 pts
- Medium complexity apps: 10-19 pts
- Todo lists, calculators, basic CRUD, weather apps, tutorial projects: 0-9 pts
- "Hello World" / basic CRUD explicitly gets 0.
- Link requirements: no links = 30-50% lower score; broken links = 20-30% lower; live demos = 10-20% higher.
- Deduct 1-5 for each project without a link.

### Category 3: Production Experience (max 25 points)
- Work experience, internships, founder/co-founder roles.
- Early-stage engineer (first 10-20 employees): bonus consideration.
- Volunteer experience also counts.

### Category 4: Technical Skills (max 10 points)
- Skills breadth, languages, evidence from projects, work, competitions.

## Bonus Points (max +20 total)
- +5: Google Summer of Code (GSoC)
- +3: Girl Script Summer of Code
- +3-5: Startup founder/co-founder
- +2-3: Early-stage engineer (first 10-20 employees)
- +2: Portfolio website with GitHub URL
- +1: LinkedIn profile
- +1-3: High-quality technical blog posts

## Deductions (positive numbers, applied as negative)
- -2 to -5: Only simple tutorial projects
- -1 to -3: Each simple project beyond the first
- -1: Generic project names ("Calculator", "Todo App", "Weather App")
- -2: All classroom assignments
- -3 to -5: Project without GitHub link, live demo, or URL
- -2 to -3: Project with GitHub link but no live demo
- -1 to -2: Broken/inactive links
- -3 to -5: All GitHub repos are self-project type

## Score Cap
Final score = base (up to 100) + bonus (up to 20) - deductions. Cannot exceed 120.

## Output Format
Return a JSON object matching this exact schema:
{
  "scores": {
    "open_source": { "score": <number>, "max": 35, "evidence": "<specific evidence from resume>" },
    "self_projects": { "score": <number>, "max": 30, "evidence": "<specific evidence from resume>" },
    "production": { "score": <number>, "max": 25, "evidence": "<specific evidence from resume>" },
    "technical_skills": { "score": <number>, "max": 10, "evidence": "<specific evidence from resume>" }
  },
  "bonus_points": { "total": <number 0-20>, "breakdown": "<how bonus points were calculated>" },
  "deductions": { "total": <positive number>, "reasons": "<specific reasons for each deduction>" },
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>", "<strength 5>"],
  "areas_for_improvement": ["<area 1>", "<area 2>", "<area 3>", "<area 4>", "<area 5>"]
}

IMPORTANT: Respond ONLY with the JSON object, no other text.`;

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function scoreResume(req, res) {
  try {
    const document = await prisma.resumeDocument.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      select: { id: true, name: true, content: true, jobDescription: true },
    });

    if (!document) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume not found' });
    }

    if (!document.content || document.content.trim().length < 50) {
      return res.status(400).json({ error: 'Insufficient Content', message: 'Resume is too short to evaluate meaningfully.' });
    }

    // Send to AI for scoring — use QUICK model for fast response
    const result = await ai.generateChat([
      { role: 'user', content: `Evaluate this resume according to the HackerRank Hiring Agent rubric:\n\n${document.content}` },
    ], { systemInstruction: SCORING_SYSTEM, modelType: 'QUICK', temperature: 0.1 });

    const text = result.text || '';
    // Extract JSON from the response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Scoring Failed', message: 'AI did not return valid JSON.', raw: text.substring(0, 500) });
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    // Calculate composite score
    const scores = evaluation.scores || {};
    const baseScore = Object.values(scores).reduce((sum, cat) => {
      return sum + Math.min((cat.score || 0), cat.max || 0);
    }, 0);
    const bonuses = (evaluation.bonus_points?.total || 0);
    const deductions = (evaluation.deductions?.total || 0);
    const total = Math.min(baseScore + bonuses - deductions, 120);

    res.json({
      documentId: document.id,
      documentName: document.name,
      total: Math.round(total * 10) / 10,
      baseScore: Math.round(baseScore * 10) / 10,
      scores,
      bonus_points: evaluation.bonus_points || { total: 0, breakdown: '' },
      deductions: evaluation.deductions || { total: 0, reasons: '' },
      key_strengths: evaluation.key_strengths || [],
      areas_for_improvement: evaluation.areas_for_improvement || [],
      gradedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Resume scoring error:', error);
    res.status(500).json({ error: 'Scoring Failed', message: error.message });
  }
}

module.exports = { scoreResume };
