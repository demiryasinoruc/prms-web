import { useEffect, useState } from "react"

/**
 * Dialog her açıldığında artan sayaç döner. Dialog component'ine `key={dialogKey}`
 * ile verilir; her açılış'ta React unmount/remount yapar, form state (React Hook
 * Form vs.) tamamen sıfırlanır.
 *
 * Tek başına `key={editingX?.id ?? "new"}` yeterli değil çünkü new → submit → new
 * sekansında key sabit "new" kaldığı için aynı component instance korunur ve form
 * state önceki kayıttan sızar.
 */
export function useDialogResetKey(open: boolean): number {
	const [key, setKey] = useState(0)
	useEffect(() => {
		if (open) setKey((k) => k + 1)
	}, [open])
	return key
}
