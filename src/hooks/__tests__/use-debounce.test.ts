import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "../use-debounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300))
    expect(result.current).toBe("initial")
  })

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    )

    // Initial value
    expect(result.current).toBe("initial")

    // Update value
    rerender({ value: "updated" })

    // Value should not change immediately
    expect(result.current).toBe("initial")

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Now value should be updated
    expect(result.current).toBe("updated")
  })

  it("cancels previous timeout on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "first" } }
    )

    rerender({ value: "second" })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: "third" })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: "fourth" })

    // Still shows first value since none of the timeouts completed
    expect(result.current).toBe("first")

    // Complete the timeout
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should show the last value
    expect(result.current).toBe("fourth")
  })

  it("uses default delay of 300ms", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "updated" })

    // After 299ms, still shows initial
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe("initial")

    // After 1 more ms (300ms total), shows updated
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe("updated")
  })

  it("respects custom delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "updated" })

    // After 300ms, still shows initial
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe("initial")

    // After 500ms total, shows updated
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe("updated")
  })
})
