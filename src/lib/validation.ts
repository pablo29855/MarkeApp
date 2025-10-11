import { z } from 'zod'

// Configurar mensajes de error en español para Zod
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        return { message: 'Este campo es obligatorio' }
      }
      return { message: `Se esperaba ${issue.expected}, pero se recibió ${issue.received}` }

    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        if (issue.minimum === 1) {
          return { message: 'Este campo es obligatorio' }
        }
        return { message: `Debe tener al menos ${issue.minimum} caracteres` }
      }
      return { message: `Debe ser mayor o igual a ${issue.minimum}` }

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Correo electrónico inválido' }
      }
      return { message: 'Formato inválido' }

    case z.ZodIssueCode.custom:
      return { message: ctx.defaultError }

    default:
      return { message: ctx.defaultError }
  }
})

export { z }