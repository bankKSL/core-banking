// ─── Score Grade Types ───────────────────────────────────────

/** Credit score letter grade */
export type ScoreGradeLetter = "A+" | "A" | "B" | "C" | "D" | "F";

/** Full grade descriptor */
export interface ScoreGrade {
  letter: ScoreGradeLetter;
  label: string;
  description: string;
  color: string;       // Tailwind CSS color classes for text
  bgColor: string;     // Tailwind CSS background classes
  barColor: string;    // CSS color value for gauge bar
  minScore: number;
  maxScore: number;
  creditAssessment: string;
  typicalInterestRate: string;
}

// ─── Grading Scale ───────────────────────────────────────────

/**
 * Standard banking credit score grading scale (300–900).
 *
 * ┌────────────┬───────┬─────────────────────────────────┐
 * │ Range      │ Grade │ Assessment                      │
 * ├────────────┼───────┼─────────────────────────────────┤
 * │ 800 – 900  │ A+    │ Exceptional creditworthiness    │
 * │ 740 – 799  │ A     │ Excellent credit history        │
 * │ 670 – 739  │ B     │ Good credit standing            │
 * │ 580 – 669  │ C     │ Fair credit — some risk         │
 * │ 500 – 579  │ D     │ Poor credit — higher risk       │
 * │ 300 – 499  │ F     │ Very poor — significant risk    │
 * └────────────┴───────┴─────────────────────────────────┘
 */
export const SCORE_GRADES: ScoreGrade[] = [
  {
    letter: "A+",
    label: "Exceptional",
    description: "Exceptional creditworthiness with a long history of responsible credit management.",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    barColor: "#059669",
    minScore: 800,
    maxScore: 900,
    creditAssessment: "Lowest risk borrower. Qualifies for the best rates and highest limits.",
    typicalInterestRate: "Base rate – Base + 2%",
  },
  {
    letter: "A",
    label: "Excellent",
    description: "Excellent credit history with consistently on-time payments and low credit utilization.",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    barColor: "#16a34a",
    minScore: 740,
    maxScore: 799,
    creditAssessment: "Very low risk. Eligible for premium products and competitive rates.",
    typicalInterestRate: "Base + 1% – Base + 3%",
  },
  {
    letter: "B",
    label: "Good",
    description: "Good credit standing with mostly on-time payments and manageable debt levels.",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    barColor: "#2563eb",
    minScore: 670,
    maxScore: 739,
    creditAssessment: "Low-to-moderate risk. Approved for most standard products.",
    typicalInterestRate: "Base + 2% – Base + 5%",
  },
  {
    letter: "C",
    label: "Fair",
    description: "Fair credit with some late payments or higher credit utilization. Moderate risk.",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    barColor: "#d97706",
    minScore: 580,
    maxScore: 669,
    creditAssessment: "Moderate risk. May require additional documentation or collateral.",
    typicalInterestRate: "Base + 4% – Base + 8%",
  },
  {
    letter: "D",
    label: "Poor",
    description: "Poor credit history with multiple delinquencies or defaults. Higher lending risk.",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    barColor: "#ea580c",
    minScore: 500,
    maxScore: 579,
    creditAssessment: "High risk. Likely requires collateral, guarantor, or higher rates.",
    typicalInterestRate: "Base + 6% – Base + 12%",
  },
  {
    letter: "F",
    label: "Very Poor",
    description: "Very poor credit or insufficient credit history. Significant lending risk.",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    barColor: "#dc2626",
    minScore: 300,
    maxScore: 499,
    creditAssessment: "Highest risk. Very limited credit options available; consider secured products.",
    typicalInterestRate: "Base + 10% – Base + 18%",
  },
];

// ─── Calculation Functions ────────────────────────────────────

/**
 * Calculate the letter grade for a given credit score.
 *
 * @param score — Numeric credit score (typically 300–900)
 * @returns The matching ScoreGrade object, or the lowest grade (F) if score is below 300
 *
 * @example
 *   calculateScoreGrade(720) // → { letter: "B", label: "Good", ... }
 *   calculateScoreGrade(810) // → { letter: "A+", label: "Exceptional", ... }
 *   calculateScoreGrade(480) // → { letter: "F", label: "Very Poor", ... }
 */
export function calculateScoreGrade(score: number): ScoreGrade {
  for (const grade of SCORE_GRADES) {
    if (score >= grade.minScore && score <= grade.maxScore) {
      return grade;
    }
  }
  // Clamp: scores below 300 get F; scores above 900 get A+
  if (score > 900) return SCORE_GRADES[0]; // A+
  return SCORE_GRADES[SCORE_GRADES.length - 1]; // F
}

/**
 * Calculate the percentage position of a score within the full scale (0–100%).
 * Used for rendering the gauge/progress bar.
 *
 * @example
 *   scoreToPercent(650) // → ~58.3
 *   scoreToPercent(850) // → ~91.7
 */
export function scoreToPercent(score: number): number {
  const clamped = Math.max(300, Math.min(900, score));
  return ((clamped - 300) / 600) * 100;
}

/**
 * Get the CSS color value for a score's gauge bar.
 */
export function getScoreBarColor(score: number): string {
  return calculateScoreGrade(score).barColor;
}
