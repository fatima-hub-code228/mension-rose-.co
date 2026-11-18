import React, { useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

export interface InquiryItem {
  key: string;
  productId: string;
  name: string;
  category: string;
  variantNote: string;
  quantity: number;
}

interface BagDrawerProps {
  open: boolean;
  items: InquiryItem[];
  onClose: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearBag: () => void;
}

export const BagDrawer: React.FC<BagDrawerProps> = ({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearBag,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [inquiryConfirmed, setInquiryConfirmed] = useState<{
    refCode: string;
    recipient: string;
  } | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const refCode = `INQ-${Math.floor(1040 + Math.random() * 8900)}`;
    setInquiryConfirmed({
      refCode,
      recipient: customerName.trim() || "Private Client",
    });
    onClearBag();
  };

  const handleClose = () => {
    setInquiryConfirmed(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#30272A]/40"
      role="dialog"
      aria-modal="true"
      aria-label="Showroom Inquiry Selection"
    >
      <div className="w-full max-w-md bg-[#FFF9F5] h-full border-l gold-hairline-strong shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b gold-hairline flex items-center justify-between bg-[#F8E4EA]/45">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-medium text-[#30272A]">
              Showroom Inquiry
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#F8E4EA] text-[#30272A] transition-colors cursor-pointer"
            aria-label="Close inquiry drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {inquiryConfirmed ? (
            <div className="rounded-xl p-6 bg-[#F8E4EA]/55 border gold-hairline text-center">
              <div className="w-11 h-11 rounded-full mx-auto bg-[#D4AF37] text-[#241C1E] flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl text-[#30272A]">
                Inquiry {inquiryConfirmed.refCode} Recorded
              </h3>
              <p className="mt-2 text-sm text-[#67575C] leading-relaxed">
                Thank you, {inquiryConfirmed.recipient}. A showroom specialist
                will follow up with verified dimensions, upholstery samples,
                and exact bespoke pricing for your selected demo items.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full py-2.5 px-4 rounded-lg btn-royal-gold text-sm font-semibold cursor-pointer"
              >
                Return to Showroom
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl text-[#30272A]">
                No demo items selected
              </p>
              <p className="mt-2 text-sm text-[#67575C]">
                Add any showroom demo piece to request verified dimensions,
                finish swatches, and private client pricing.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl border gold-hairline bg-[#FFF9F5]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-[#8A604B]">
                          {item.category} · Demo Item
                        </p>
                        <h3 className="font-display text-xl font-medium text-[#30272A]">
                          {item.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.key)}
                        className="p-1.5 text-[#67575C] hover:text-[#30272A] transition-colors cursor-pointer"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs text-[#67575C]">
                      {item.variantNote}
                    </p>

                    <div className="mt-4 pt-3 border-t gold-hairline flex items-center justify-between">
                      <div className="flex items-center border gold-hairline rounded-md">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, -1)}
                          className="p-1.5 hover:bg-[#F8E4EA] text-[#30272A] cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.key, 1)}
                          className="p-1.5 hover:bg-[#F8E4EA] text-[#30272A] cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-medium text-[#8A604B]">
                        Price on Request
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form
                id="inquiry-form"
                onSubmit={handleSubmit}
                className="pt-4 border-t gold-hairline space-y-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8A604B]">
                  Request Verified Quote &amp; Swatches
                </p>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F5] border gold-hairline text-sm text-[#30272A] focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F5] border gold-hairline text-sm text-[#30272A] focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Preferred finish or room dimensions (optional)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FFF9F5] border gold-hairline text-sm text-[#30272A] focus:outline-none focus:border-[#D4AF37]"
                />
              </form>
            </>
          )}
        </div>

        {items.length > 0 && !inquiryConfirmed && (
          <div className="px-6 py-5 border-t gold-hairline bg-[#F8E4EA]/35 space-y-3">
            <div className="flex justify-between text-xs text-[#67575C]">
              <span>Selected Demo Pieces</span>
              <span className="tabular-nums font-semibold text-[#30272A]">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              type="submit"
              form="inquiry-form"
              className="w-full py-3.5 px-5 rounded-lg btn-royal-gold text-sm font-semibold cursor-pointer"
            >
              Submit Showroom Inquiry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
