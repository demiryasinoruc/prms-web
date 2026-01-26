import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/test/test-utils"
import userEvent from "@testing-library/user-event"
import { Input } from "../input"

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument()
  })

  it("handles text input", async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)

    const input = screen.getByPlaceholderText("Type here")
    await user.type(input, "Hello World")

    expect(input).toHaveValue("Hello World")
  })

  it("handles onChange events", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Input onChange={handleChange} placeholder="Test" />)

    await user.type(screen.getByPlaceholderText("Test"), "a")
    expect(handleChange).toHaveBeenCalled()
  })

  it("is disabled when disabled prop is true", () => {
    render(<Input disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled()
  })

  it("accepts different types", () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("type", "email")

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password")
  })

  it("accepts custom className", () => {
    render(<Input className="custom-input" placeholder="Custom" />)
    expect(screen.getByPlaceholderText("Custom")).toHaveClass("custom-input")
  })

  it("forwards ref correctly", () => {
    const ref = vi.fn()
    render(<Input ref={ref} placeholder="With ref" />)
    expect(ref).toHaveBeenCalled()
  })
})
