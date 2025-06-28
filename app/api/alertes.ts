import type { NextApiRequest, NextApiResponse } from "next"
import { sendAlertEmail } from "@/lib/email"

type Alert = {
  id: number
  message: string
  priority: string
  machineId: string
  timestamp: string
}

let fakeDatabase: Alert[] = []

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { message, priority, machineId } = req.body

    if (!message || !priority || !machineId) {
      return res.status(400).json({ error: "Missing fields" })
    }

    const newAlert: Alert = {
      id: Date.now(),
      message,
      priority,
      machineId,
      timestamp: new Date().toISOString(),
    }

    fakeDatabase.push(newAlert)

    try {
      // Send email notification instead of SMS
      const emailResult = await sendAlertEmail({
        message,
        messageRole: "System Alert",
        type: "Machine Alert",
        requiredAction: "Please check the machine immediately",
        priority,
        machineId,
      })

      if (emailResult.success) {
        res.status(201).json({ success: true, alert: newAlert, emailSent: true })
      } else {
        console.warn('Email notification failed:', emailResult.error)
        res.status(201).json({ success: true, alert: newAlert, emailSent: false })
      }
    } catch (error) {
      console.error("Email error:", error)
      res.status(201).json({ success: true, alert: newAlert, emailSent: false })
    }
  } else if (req.method === "GET") {
    res.status(200).json(fakeDatabase)
  } else {
    res.status(405).json({ error: "Méthode non autorisée" })
  }
}
