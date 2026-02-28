import { zodResolver } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"

/**
 * Type-safe wrapper around zodResolver for Zod 4.
 *
 * @hookform/resolvers v5 uses z4.input<T> for TFieldValues (optional fields),
 * but useForm<z.infer<T>> uses z4.output<T> (required fields with defaults).
 * This wrapper bridges the input/output type gap without using `as any`.
 *
 * Can be removed once @hookform/resolvers aligns input/output types.
 */
export function formResolver<T extends FieldValues>(
  schema: Parameters<typeof zodResolver>[0],
): Resolver<T> {
  return zodResolver(schema) as Resolver<T>
}
