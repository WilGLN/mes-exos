import { useCallback, useEffect, useState } from 'react'
import type { TrainingLevel } from '../types/trainingCatalog'
import { fetchTrainingLevels } from '../lib/trainingCatalog'

export function useTrainingCatalog(initialFilter?: { type?: 'progression' | 'entretien' | 'avance'; debutant?: boolean }) {
  const [levels, setLevels] = useState<TrainingLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await fetchTrainingLevels(initialFilter)
    if (e) {
      setError(e.message)
      setLevels([])
    } else {
      setLevels(data)
    }
    setLoading(false)
  }, [initialFilter?.debutant, initialFilter?.type])

  useEffect(() => {
    void load()
  }, [load])

  return { levels, loading, error, reload: load }
}
