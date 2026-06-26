import { formatMoney } from "@/api"
import { ADDON_DATA } from "@/constant"
import {
  InvInput,
  Modal,
  ModalActions,
  ModalBody,
  ModalDesc,
  ModalError,
  ModalTitle,
  PwInput,
  Qr,
  RadioRow,
} from "@/components/Modal"
import type { PersonalModalsProps } from "../../types"
import './index.scss'

export function PersonalModals({
  modal,
  stop,
  closeModal,
  phoneBinding,
  emailBinding,
  bindModal,
  passwordModal,
  wechatModal,
  qrCells,
  upgradeTarget,
  upgradePreview,
  upgradeLoading,
  upgradePlanCode,
  yr,
  onConfirmUpgrade,
  addonPick,
  setAddonPick,
  onConfirmAddon,
  planName,
  cancelExpireDate,
  onConfirmCancel,
  invoiceModal,
  onSubmitInvoice,
  onDownloadInvoice,
}: PersonalModalsProps) {
  if (!modal) return null

  const wide = modal === "upgrade" || modal === "invoice"

  return (
    <Modal wide={wide} onOverlayClick={stop}>
        {(modal === "bindPhone" || modal === "bindEmail") && (() => {
          const isPhone = modal === "bindPhone"
          const bound = isPhone ? phoneBinding.bound : emailBinding.bound
          const { mPhone, setMPhone, mEmail, setMEmail, mCode, setMCode, mError, setMError, mCountdown, mSubmitting, sendMCode, submitBind } = bindModal
          return (
            <ModalBody>
              <ModalTitle>{isPhone ? (bound ? "更换手机号" : "绑定手机号") : (bound ? "更换邮箱" : "绑定邮箱")}</ModalTitle>
              <ModalDesc>{isPhone ? "仅支持国内手机号，默认 +86。" : "我们会发送验证邮件到新邮箱确认。"}</ModalDesc>
              <div className="personalModals-inputWrap">
                {isPhone && <span className="personalModals-prefix">+86</span>}
                {isPhone
                  ? <input className="personalModals-textInput" value={mPhone} onChange={(e) => { setMPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 11)); setMError("") }} inputMode="numeric" placeholder="输入新手机号" />
                  : <input className="personalModals-textInput" value={mEmail} onChange={(e) => { setMEmail(e.target.value); setMError("") }} placeholder="输入新邮箱地址" />}
              </div>
              <div className="personalModals-codeWrap">
                <input className="personalModals-codeInput" value={mCode} onChange={(e) => { setMCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setMError("") }} inputMode="numeric" placeholder={isPhone ? "输入验证码" : "输入邮箱验证码"} />
                <button type="button" onClick={sendMCode} disabled={mCountdown > 0 || mSubmitting} className={`personalModals-codeBtn ${mCountdown > 0 || mSubmitting ? "personalModals-codeBtnDisabled" : "personalModals-codeBtnActive"}`}>{mSubmitting ? "发送中…" : mCountdown > 0 ? `${mCountdown}s` : "获取验证码"}</button>
              </div>
              {mError && <ModalError>{mError}</ModalError>}
              <ModalActions onCancel={closeModal} onConfirm={submitBind} confirmLabel={mSubmitting ? "提交中…" : "确认绑定"} cancelLabel="取消" />
            </ModalBody>
          )
        })()}

        {modal === "bindWechat" && (() => {
          const { wechatQrUrl, wechatLoading } = wechatModal
          return (
            <ModalBody center>
              <ModalTitle>绑定微信</ModalTitle>
              <ModalDesc>使用微信扫一扫完成绑定</ModalDesc>
              <div className="personalModals-qrBox">
                {wechatQrUrl
                  ? <img src={`https://quickchart.io/qr?text=${encodeURIComponent(wechatQrUrl)}&size=150&margin=0`} alt="微信绑定二维码" className="personalModals-qrImg" />
                  : <Qr cells={qrCells} />}
                {!wechatLoading && wechatQrUrl && (
                  <div className="personalModals-wechatBadge"><div className="personalModals-wechatIcon" /></div>
                )}
              </div>
              <div className="personalModals-qrHint">{wechatLoading ? "二维码加载中…" : "扫码后自动完成绑定"}</div>
              <button type="button" onClick={closeModal} className={`pc-back personalModals-cancelLink`}>取消</button>
            </ModalBody>
          )
        })()}

        {modal === "password" && (() => {
          const { pwOld, setPwOld, pwNew1, setPwNew1, pwNew2, setPwNew2, pwErr, setPwErr, pwSubmitting, pwFirstTime, submitPw } = passwordModal
          return (
            <ModalBody>
              <ModalTitle>{pwFirstTime ? "设置登录密码" : "修改登录密码"}</ModalTitle>
              <ModalDesc>{pwFirstTime ? "首次设置密码，无需填写原密码。" : "请输入原密码与新密码。"}</ModalDesc>
              {!pwFirstTime && <PwInput value={pwOld} onChange={(v) => { setPwOld(v); setPwErr("") }} placeholder="原密码" mt={18} />}
              <PwInput value={pwNew1} onChange={(v) => { setPwNew1(v); setPwErr("") }} placeholder="新密码（至少 8 位）" mt={11} />
              <PwInput value={pwNew2} onChange={(v) => { setPwNew2(v); setPwErr("") }} placeholder="确认新密码" mt={11} />
              {pwErr && <ModalError>{pwErr}</ModalError>}
              <ModalActions onCancel={closeModal} onConfirm={submitPw} confirmLabel={pwSubmitting ? "提交中…" : "提交修改"} cancelLabel="取消" />
            </ModalBody>
          )
        })()}

        {modal === "upgrade" && (
          <ModalBody>
            <ModalTitle>升级到 {upgradePreview?.planName || upgradeTarget || "Pro Max"}</ModalTitle>
            <ModalDesc>升级即时生效，已支付的费用将按比例抵扣。</ModalDesc>
            <div className="personalModals-previewBox">
              {upgradeLoading ? (
                <div className="personalModals-previewLoading">加载差价预览中…</div>
              ) : (
                <>
                  <div className="personalModals-previewRow"><span className="personalModals-previewLabel">{upgradePreview?.planName || upgradeTarget || "Pro Max"} · {yr ? "按年" : "按月"}</span><span className="personalModals-previewValue">{upgradePreview ? formatMoney(upgradePreview.originalPriceCents) : (yr ? "¥1188" : "¥139")}</span></div>
                  <div className="personalModals-previewRow" style={{ marginTop: 10 }}><span className="personalModals-previewLabel">升级退差价（抵扣）</span><span className="personalModals-previewDiscount">- {upgradePreview ? formatMoney(upgradePreview.discountCents) : "¥36.00"}</span></div>
                  <div className="personalModals-previewDivider" />
                  <div className="personalModals-previewTotal"><span className="personalModals-previewTotalLabel">实付</span><span className="personalModals-previewTotalValue">{upgradePreview ? formatMoney(upgradePreview.payableCents) : (yr ? "¥1152.00" : "¥103.00")}</span></div>
                </>
              )}
            </div>
            <div className="personalModals-paySection">
              {upgradePreview?.payUrl
                ? <img src={upgradePreview.payUrl} alt="支付二维码" className="personalModals-payQrImg" />
                : <div className="personalModals-payQrBox"><Qr cells={qrCells} /></div>}
              <div className="personalModals-payHint">微信 / 支付宝 扫码支付</div>
            </div>
            <ModalActions onCancel={closeModal} onConfirm={onConfirmUpgrade} confirmLabel={upgradePlanCode ? "确认升级" : "模拟支付成功"} cancelLabel="稍后再说" />
          </ModalBody>
        )}

        {modal === "addon" && (
          <ModalBody>
            <ModalTitle>购买积分加量包</ModalTitle>
            <ModalDesc>选择档位，支付后立即到账。</ModalDesc>
            <div className="personalModals-addonList">
              {ADDON_DATA.map((a, i) => {
                const on = addonPick === i
                return (
                  <button key={i} type="button" onClick={() => setAddonPick(i)} className={`personalModals-addonBtn ${on ? "personalModals-addonBtnOn" : ""}`}>
                    <div><div className="personalModals-addonCredits">{a.credits} 积分</div><div className="personalModals-addonNote">{a.note}</div></div>
                    <div className="personalModals-addonPrice">{a.price}</div>
                  </button>
                )
              })}
            </div>
            <ModalActions onCancel={closeModal} onConfirm={onConfirmAddon} confirmLabel="确认购买" cancelLabel="取消" />
          </ModalBody>
        )}

        {modal === "cancel" && (
          <ModalBody>
            <ModalTitle>取消自动续费？</ModalTitle>
            <p className="personalModals-cancelBody">取消自动续费将停止后续扣费，你仍可在 <b style={{ color: "#1B1530" }}>{cancelExpireDate}</b> 前继续使用当前 {planName} 权益。到期后将自动降为免费版。</p>
            <div className="personalModals-cancelActions">
              <button type="button" onClick={closeModal} className={`pc-primary personalModals-keepBtn`}>继续保留</button>
              <button type="button" onClick={onConfirmCancel} className={`pc-danger-soft personalModals-confirmCancelBtn`}>确认取消</button>
            </div>
          </ModalBody>
        )}

        {modal === "invoice" && (() => {
          const { invType, setInvType, invHead, setInvHead, invTitle, setInvTitle, invTax, setInvTax, invEmail, setInvEmail, invNote, setInvNote, invErr, setInvErr } = invoiceModal
          return (
            <ModalBody scroll>
              <div className="personalModals-invoiceHeader">
                <ModalTitle>填写开票信息</ModalTitle>
                <button type="button" onClick={closeModal} className={`pc-soft personalModals-invoiceCloseBtn`}>✕</button>
              </div>
              <ModalDesc className="personalModals-invoiceDesc">信息将用于开具发票与发送电子发票，请仔细核对。</ModalDesc>
              <div className="personalModals-invoiceSummary">
                <div className="personalModals-invoiceSummaryLabel">本单可开金额 <span className="personalModals-invoiceSummaryHint">ⓘ</span></div>
                <div className="personalModals-invoiceAmount">¥901.80</div>
                <div className="personalModals-invoiceDivider" />
                <div className="personalModals-invoiceMeta">
                  <div>原价 <b className="personalModals-invoiceMetaBold">¥948.00</b></div>
                  <div>折扣价 <b className="personalModals-invoiceMetaBold">—</b></div>
                  <div>总可开金额 <b className="personalModals-invoiceMetaBold">¥1000.80</b></div>
                </div>
              </div>
              <div className="personalModals-invoiceForm">
                <RadioRow label="发票类型" options={[["normal", "普通发票"], ["special", "专用发票"]]} value={invType} onChange={setInvType} />
                <RadioRow label="抬头类型" options={[["company", "企业"], ["personal", "个人"]]} value={invHead} onChange={setInvHead} />
                <InvInput label="发票抬头" value={invTitle} onChange={(v) => { setInvTitle(v); setInvErr("") }} placeholder="例如：北京某某科技有限公司" />
                {invHead === "company" && <InvInput label="企业税号" value={invTax} onChange={(v) => { setInvTax(v); setInvErr("") }} placeholder="请输入 15-20 位纳税人识别号" />}
                <InvInput label="邮箱地址" value={invEmail} onChange={(v) => { setInvEmail(v); setInvErr("") }} placeholder="请输入电子邮箱地址" />
                <div className="personalModals-noteRow">
                  <span className="personalModals-noteLabel">备注</span>
                  <div className="personalModals-noteField">
                    <textarea className="personalModals-noteTextarea" value={invNote} onChange={(e) => setInvNote(e.target.value.slice(0, 100))} maxLength={100} placeholder="选填" />
                    <span className="personalModals-noteCounter">{invNote.length} / 100</span>
                  </div>
                </div>
              </div>
              {invErr && <ModalError style={{ marginTop: 10 }}>{invErr}</ModalError>}
              <div className="personalModals-invoiceActions">
                <button type="button" onClick={closeModal} className={`pc-soft personalModals-invoiceCancelBtn`}>取消</button>
                <button type="button" onClick={onSubmitInvoice} className={`pc-primary personalModals-invoiceSubmitBtn`}>提交</button>
              </div>
            </ModalBody>
          )
        })()}

        {modal === "viewInvoice" && (
          <ModalBody>
            <ModalTitle>查看发票</ModalTitle>
            <div className="personalModals-viewInvoiceBox">
              <div className="personalModals-viewInvoiceRow">
                <div className="personalModals-pdfIcon">PDF</div>
                <div>
                  <div className="personalModals-viewInvoiceName">增值税电子普通发票.pdf</div>
                  <div className="personalModals-viewInvoiceMeta">¥468.00 · 2026-03-20</div>
                </div>
              </div>
            </div>
            <ModalActions onCancel={closeModal} onConfirm={onDownloadInvoice} confirmLabel="下载 PDF" cancelLabel="关闭" />
          </ModalBody>
        )}
    </Modal>
  )
}
