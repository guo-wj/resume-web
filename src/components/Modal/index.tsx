import type {
  InvInputProps,
  ModalActionsProps,
  ModalBodyProps,
  ModalDescProps,
  ModalErrorProps,
  ModalProps,
  ModalTitleProps,
  PwInputProps,
  QrProps,
  RadioRowProps,
} from "./types"
import "./index.scss"

export function Modal({ wide, onOverlayClick, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onOverlayClick} role="presentation">
      <div
        className={`modal-dialog ${wide ? "modal-dialogWide" : "modal-dialogNarrow"}`}
        onClick={onOverlayClick}
        role="dialog"
      >
        {children}
      </div>
    </div>
  )
}

export function ModalBody({ center, scroll, className, children }: ModalBodyProps) {
  const variant = center ? "modal-bodyCenter" : scroll ? "modal-bodyScroll" : "modal-body"
  return <div className={[variant, className].filter(Boolean).join(" ")}>{children}</div>
}

export function ModalTitle({ children }: ModalTitleProps) {
  return <div className="modal-title">{children}</div>
}

export function ModalDesc({ children, className }: ModalDescProps) {
  return <p className={["modal-desc", className].filter(Boolean).join(" ")}>{children}</p>
}

export function ModalError({ children, className, style }: ModalErrorProps) {
  return (
    <div className={["modal-error", className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>
  )
}

export function Qr({ cells }: QrProps) {
  return (
    <div className="modal-qrGrid">
      {cells.map((on, i) => (
        <div key={i} className={`modal-qrCell ${on ? "modal-qrCellOn" : "modal-qrCellOff"}`} />
      ))}
    </div>
  )
}

export function ModalActions({ onCancel, onConfirm, cancelLabel, confirmLabel }: ModalActionsProps) {
  return (
    <div className="modal-actions">
      <button type="button" onClick={onCancel} className="pc-soft modal-cancelBtn">{cancelLabel}</button>
      <button type="button" onClick={onConfirm} className="pc-primary modal-confirmBtn">{confirmLabel}</button>
    </div>
  )
}

export function PwInput({ value, onChange, placeholder, mt }: PwInputProps) {
  return (
    <div className="modal-pwInputWrap" style={{ marginTop: mt }}>
      <input
        className="modal-pwInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="password"
        placeholder={placeholder}
      />
    </div>
  )
}

export function InvInput({ label, value, onChange, placeholder }: InvInputProps) {
  return (
    <div className="modal-invInputRow">
      <span className="modal-invInputLabel">{label}</span>
      <div className="modal-invInputField">
        <input
          className="modal-invInput"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

export function RadioRow({ label, options, value, onChange }: RadioRowProps) {
  return (
    <div className="modal-radioRow">
      <span className="modal-invInputLabel">{label}</span>
      <div className="modal-radioOptions">
        {options.map(([id, text]) => {
          const on = value === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`modal-radioBtn ${on ? "modal-radioBtnOn" : "modal-radioBtnOff"}`}
            >
              <span className={`modal-radioDot ${on ? "modal-radioDotOn" : ""}`} />
              {text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export type * from "./types"
