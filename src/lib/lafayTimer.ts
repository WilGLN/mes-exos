/** Presets repos inter-séries alignés sur le livre Méthode Lafay (ordre croissant). */
export type ReposPreset = {
  label: string
  seconds: number
  description: string
}

export const REPOS_PRESETS_LAFAY: ReposPreset[] = [
  { label: '25 s', seconds: 25, description: 'Repos court — entre séries (quasi universel niveaux 1–13)' },
  { label: '45 s', seconds: 45, description: 'Repos moyen court (intermédiaire pratique)' },
  { label: '1 min', seconds: 60, description: 'Repos moyen — ex. K2 niveau 2, entre certains exercices' },
  { label: '1 min 30', seconds: 90, description: 'Repos long — niveaux 7–9 (J, K, L, I4, I5)' },
  { label: '2 min', seconds: 120, description: 'Repos entre exercices — niveaux 1–3' },
  { label: '2 min 30', seconds: 150, description: 'Repos entre exercices (ex. après A12, aller plus loin)' },
  { label: '3 min', seconds: 180, description: 'Repos long — après C3, I, grands groupes (niveaux 4–8)' },
]

export const CITATION_REPOS_LAFAY =
  'Le livre prescrit 25 s entre séries pour la quasi-totalité des niveaux. Ne modifiez pas vos temps de repos — Olivier Lafay, p.16'

export const NOTE_MICRO_PAUSE =
  'Micro-pause 3–5 s en cours de série (pause-reps, bras tendus) : utilise « +10 s » ou les réglages ; ce n’est pas un repos inter-séries.'

export const DEFAULT_REPOS_SECONDS = 25
