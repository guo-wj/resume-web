import type { CSSProperties, MouseEvent, ReactNode } from "react"

export interface ModalProps {
  wide?: boolean
  onOverlayClick?: (e: MouseEvent) => void
  onBack?: () => void
  children: ReactNode
}

export interface ModalBodyProps {
  center?: boolean
  scroll?: boolean
  className?: string
  children: ReactNode
}

export interface ModalTitleProps {
  children: ReactNode
}

export interface ModalDescProps {
  children: ReactNode
  className?: string
}

export interface ModalErrorProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export interface QrProps {
  cells: boolean[]
}

export interface ModalActionsProps {
  onCancel: () => void
  onConfirm: () => void
  cancelLabel: string
  confirmLabel: string
}

export interface PwInputProps {
  value: string
  onChange: (v: string) => void
  placeholder: string
  mt?: number
}

export interface InvInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}

export interface RadioRowProps {
  label: string
  options: [string, string][]
  value: string
  onChange: (v: string) => void
}
