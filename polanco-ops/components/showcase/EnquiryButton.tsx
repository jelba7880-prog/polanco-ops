// TODO(Phase C): wire this up to a real WhatsApp deep link / lead capture flow.
export function EnquiryButton() {
  return (
    <button
      type="button"
      disabled
      className="w-full h-12 rounded-lg bg-gold text-ink font-inter text-sm font-medium opacity-50 cursor-not-allowed"
    >
      Enquire via WhatsApp
    </button>
  )
}
