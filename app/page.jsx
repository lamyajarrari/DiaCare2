"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      router.push(`/dashboard/${user.role}`)
    } else {
      router.push("/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
       
        <div className="mx-auto mb-6">
          <Image
            src="/logo.png"
            alt="Logo DiaCare"
            width={180}
            height={180}
            className="mx-auto"
          />
        </div>

        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
