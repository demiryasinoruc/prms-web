import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr"
import { toast } from "sonner"

import { notificationKeys } from "./hooks"
import { NotificationType, NotificationTypeLabels } from "./api"

interface RealtimeNotificationPayload {
  id: string
  type: NotificationType
  title: string
  message: string
  actionUrl: string | null
  createdDate: string
}

/**
 * Bildirimler için SignalR bağlantısını yönetir. Sunucu bir bildirim push
 * ettiğinde sayaç + liste sorgularını tazeler ve bir toast gösterir.
 * Yalnızca oturum açıkken (token mevcutken) bağlanır; polling fallback olarak kalır.
 */
export function useNotificationHub() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      return
    }

    const baseUrl = import.meta.env.VITE_API_URL
    const connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`, {
        accessTokenFactory: () => localStorage.getItem("token") ?? "",
        // Kimlik doğrulama bearer/query token ile yapılıyor; cookie kullanmıyoruz.
        // withCredentials=false olunca sunucuda Allow-Credentials gerekmez.
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on("ReceiveNotification", (payload: RealtimeNotificationPayload) => {
      // Sayaç ve listeyi anında tazele
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })

      const label = NotificationTypeLabels[payload.type] ?? "Bildirim"
      toast.info(payload.title || label, {
        description: payload.message,
      })
    })

    let disposed = false

    // start() promise'ini sakla; cleanup negotiate ortasında stop() çağırıp
    // "stopped during negotiation" hatası üretmesin diye start bitene kadar bekler.
    const startPromise = connection.start().catch((err) => {
      if (!disposed) {
        // Bağlantı kurulamazsa sessizce polling'e güveniriz
        console.warn("Bildirim hub bağlantısı kurulamadı:", err)
      }
    })

    return () => {
      disposed = true
      startPromise.finally(() => {
        if (connection.state !== HubConnectionState.Disconnected) {
          connection.stop().catch(() => {})
        }
      })
    }
  }, [queryClient])
}
