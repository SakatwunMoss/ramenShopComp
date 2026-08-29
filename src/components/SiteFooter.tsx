export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-[#c97868] text-steam">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm sm:px-6">
        <p className="font-[family-name:var(--font-display)] text-base tracking-wide">
          Ramen Compare
        </p>
        <p className="max-w-2xl leading-relaxed text-steam/80">
          掲載データはホットペッパーグルメに公開されている店舗が対象です。個人経営の小規模店など、網羅できない場合があります。Powered by{" "}
          <a
            href="https://webservice.recruit.co.jp/"
            className="underline decoration-steam/40 underline-offset-2 hover:decoration-steam"
            target="_blank"
            rel="noopener noreferrer"
          >
            ホットペッパーグルメ Webサービス
          </a>
          .
        </p>
        <p className="text-steam/55">© {new Date().getFullYear()} Ramen Compare</p>
      </div>
    </footer>
  );
}
