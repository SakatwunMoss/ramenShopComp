type AdSenseSlotProps = {
  slot?: string;
  className?: string;
  label?: string;
};

/** 審査申請前のプレースホルダ。CLIENT_ID 設定後に差し替え可能 */
export function AdSenseSlot({
  slot = "0000000000",
  className = "",
  label = "Advertisement",
}: AdSenseSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <aside
      className={`flex min-h-[90px] items-center justify-center border border-dashed border-line bg-steam/60 text-xs text-ink-muted ${className}`}
      aria-label={label}
      data-ad-slot={slot}
      data-ad-client={clientId ?? "pending"}
    >
      {clientId ? (
        <span>AdSense slot: {slot}</span>
      ) : (
        <span>Ad placeholder</span>
      )}
    </aside>
  );
}
