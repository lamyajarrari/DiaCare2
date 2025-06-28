"use client"

import { useState, useEffect } from 'react'

export function useInterventionsCount(userRole, userId = null) {
  const [interventionsCount, setInterventionsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInterventionsCount = async () => {
      try {
        setLoading(true)
        
        // Construire l'URL de l'API selon le rôle
        let apiUrl = '/api/interventions'
        
        // Si c'est un technicien spécifique, filtrer par son ID
        if (userRole === 'technician' && userId) {
          apiUrl += `?technicianId=${userId}`
        }
        
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const interventions = await response.json()
          setInterventionsCount(interventions.length)
        } else {
          console.error('Failed to fetch interventions count')
          setInterventionsCount(0)
        }
      } catch (error) {
        console.error('Error fetching interventions count:', error)
        setInterventionsCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Récupérer le nombre d'interventions immédiatement
    fetchInterventionsCount()

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchInterventionsCount, 30000)

    return () => clearInterval(interval)
  }, [userRole, userId])

  return { interventionsCount, loading }
} 