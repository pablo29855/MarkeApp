import { toast } from 'sonner'
import { CheckCircle2, XCircle, AlertCircle, Info, Trash2, Edit3, Save } from 'lucide-react'
import { createElement } from 'react'

export const useNotification = () => {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: createElement(CheckCircle2, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showError = (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: createElement(XCircle, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: createElement(AlertCircle, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: createElement(Info, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showSaved = (entity: string = 'Registro') => {
    toast.success(`${entity} guardado`, {
      description: 'Los cambios se han guardado correctamente',
      icon: createElement(Save, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showUpdated = (entity: string = 'Registro') => {
    toast.success(`${entity} actualizado`, {
      description: 'Los cambios se han actualizado correctamente',
      icon: createElement(Edit3, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showDeleted = (entity: string = 'Registro') => {
    toast.success(`${entity} eliminado`, {
      description: 'El elemento se ha eliminado correctamente',
      icon: createElement(Trash2, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  const showCreated = (entity: string = 'Registro') => {
    toast.success(`${entity} creado`, {
      description: 'El nuevo elemento se ha creado correctamente',
      icon: createElement(CheckCircle2, { className: 'h-5 w-5' }),
      className: 'animate-slide-in-right',
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSaved,
    showUpdated,
    showDeleted,
    showCreated,
  }
}
