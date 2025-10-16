/**
 * Mensajes de validación personalizados según el tipo de campo
 */

export const validationMessages = {
  // Campos de texto generales
  text: {
    required: 'Por favor, completa este campo',
    empty: 'Este campo no puede estar vacío',
  },
  
  // Campos numéricos y montos
  number: {
    required: 'Ingresa un monto',
    empty: 'El monto no puede estar vacío',
    invalid: 'Ingresa un monto válido',
    positive: 'El monto debe ser mayor a cero',
  },
  
  // Campos de selección
  select: {
    required: 'Selecciona una opción',
    category: 'Selecciona una categoría',
    type: 'Selecciona un tipo',
  },
  
  // Campos de fecha
  date: {
    required: 'Selecciona una fecha',
    empty: 'La fecha no puede estar vacía',
    invalid: 'Ingresa una fecha válida',
  },
  
  // Campos específicos
  description: {
    required: 'Ingresa una descripción',
    empty: 'La descripción no puede estar vacía',
  },
  
  name: {
    required: 'Ingresa un nombre',
    empty: 'El nombre no puede estar vacío',
  },
  
  email: {
    required: 'Ingresa un correo electrónico',
    invalid: 'Ingresa un correo electrónico válido',
  },
  
  password: {
    required: 'Ingresa una contraseña',
    minLength: 'La contraseña debe tener al menos 6 caracteres',
  },
}

/**
 * Helper para obtener mensajes de validación específicos
 */
export const getValidationMessage = (field: string, type: 'required' | 'empty' | 'invalid' = 'required'): string => {
  // Campos específicos
  if (field.includes('description')) {
    return type === 'invalid' ? validationMessages.description.required : (validationMessages.description[type] || validationMessages.description.required)
  }
  if (field.includes('name')) {
    return type === 'invalid' ? validationMessages.name.required : (validationMessages.name[type] || validationMessages.name.required)
  }
  if (field.includes('amount') || field.includes('monto')) {
    return validationMessages.number[type] || validationMessages.number.required
  }
  if (field.includes('date') || field.includes('fecha')) {
    return validationMessages.date[type] || validationMessages.date.required
  }
  if (field.includes('category') || field.includes('categoria')) {
    return validationMessages.select.category
  }
  if (field.includes('type') || field.includes('tipo')) {
    return validationMessages.select.type
  }
  if (field.includes('email') || field.includes('correo')) {
    return type === 'empty' ? validationMessages.email.required : (validationMessages.email[type] || validationMessages.email.required)
  }
  if (field.includes('password') || field.includes('contraseña')) {
    return validationMessages.password.required
  }
  
  // Por defecto
  return validationMessages.text.required
}
