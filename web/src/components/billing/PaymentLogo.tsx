// Loga metod płatności jako markowe wordmarki (kolory marek, własny render — bezpieczne prawnie).
// Docelowo można podmienić pojedynczy case na oficjalny SVG z brand kitu danego dostawcy.
type Props = { id: string; label: string; brand: string };

const Mark = ({ ch, bg, fg = "#fff" }: { ch: string; bg: string; fg?: string }) => (
  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[13px] font-bold" style={{ background: bg, color: fg }}>{ch}</span>
);

export default function PaymentLogo({ id, label, brand }: Props) {
  // Warianty rozpoznawalne dla najpopularniejszych marek; reszta = mark + wordmark.
  switch (id) {
    case "stripe":
      return <span className="text-[17px] font-bold lowercase tracking-tight" style={{ color: brand }}>stripe</span>;
    case "paypal":
      return (
        <span className="text-[16px] font-extrabold italic tracking-tight">
          <span style={{ color: "#003087" }}>Pay</span><span style={{ color: "#009cde" }}>Pal</span>
        </span>
      );
    case "p24":
      return (
        <span className="inline-flex items-center text-[15px] font-bold tracking-tight text-graphite">
          Przelewy<span className="ml-0.5 rounded bg-[#d4022a] px-1 text-white">24</span>
        </span>
      );
    case "payu":
      return <span className="text-[16px] font-extrabold tracking-tight"><span style={{ color: "#5a9e1b" }}>Pay</span><span className="text-graphite">U</span></span>;
    case "tpay":
      return <span className="text-[16px] font-bold lowercase tracking-tight" style={{ color: brand }}>tpay</span>;
    case "blik":
      return <span className="text-[16px] font-extrabold tracking-tight text-graphite">BLIK</span>;
    case "paddle":
      return (
        <span className="inline-flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-graphite">
          <span className="h-3 w-3 rounded-full bg-[#fdd535]" /> Paddle
        </span>
      );
    case "invoice":
      return (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-graphite">
          <Mark ch="₣" bg={brand} /> Faktura B2B
        </span>
      );
    case "voucher":
      return (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-graphite">
          <Mark ch="◷" bg={brand} /> Voucher
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: brand }}>
          <Mark ch={label.charAt(0)} bg={brand} /> {label}
        </span>
      );
  }
}
