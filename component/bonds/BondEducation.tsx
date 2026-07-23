import {
  ArrowRight,
  BadgePercent,
  BookOpenText,
  Calculator,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  ExternalLink,
  Landmark,
  ReceiptText,
  Scale,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ImigongoBackground } from "@/component/shared/ImigongoBackground";
import { BondThemeToggle, GaboBrand } from "./BondSiteChrome";
import { CopyOrderTemplate } from "./CopyOrderTemplate";

const anchors = [
  {
    id: "start",
    number: "00",
    label: "Start from zero",
    detail: "Definitions, 100k units, and beginner FAQ",
  },
  {
    id: "physics",
    number: "01",
    label: "Learn the numbers",
    detail: "Face value, coupon, price, and tax",
  },
  {
    id: "bad-deals",
    number: "02",
    label: "Avoid bad deals",
    detail: "YTM, premiums, and reinvestment risk",
  },
  {
    id: "alpha-deals",
    number: "03",
    label: "Execute the deal",
    detail: "Broker orders, discounts, and RSE screening",
  },
];

function LessonHeader({
  eyebrow,
  title,
  introduction,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
}) {
  return (
    <header className="max-w-4xl">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--md-sys-color-primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-on-surface md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-on-surface-variant">
        {introduction}
      </p>
    </header>
  );
}

function LessonCard({
  icon,
  kicker,
  title,
  children,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-6 shadow-sm backdrop-blur-xl md:p-8">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-[var(--md-sys-color-primary)]">
          {icon}
        </span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">
            {kicker}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-on-surface md:text-2xl">
            {title}
          </h3>
        </div>
      </div>
      <div className="mt-6 space-y-5 text-sm leading-7 text-on-surface-variant md:text-[15px] md:leading-8">
        {children}
      </div>
    </article>
  );
}

function Equation({
  tone = "primary",
  title,
  children,
}: {
  tone?: "primary" | "error";
  title: string;
  children: ReactNode;
}) {
  const classes =
    tone === "error"
      ? "border-error/20 bg-error-container/10"
      : "border-primary/20 bg-primary-container/10";

  return (
    <aside className={`rounded-3xl border p-5 md:p-6 ${classes}`}>
      <p
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
          tone === "error"
            ? "text-error"
            : "text-[var(--md-sys-color-primary)]"
        }`}
      >
        {title}
      </p>
      <div className="mt-3 text-sm leading-7 text-on-surface md:text-[15px]">
        {children}
      </div>
    </aside>
  );
}

function MathFormula({
  label,
  caption,
  children,
}: {
  label: string;
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure
      role="math"
      aria-label={label}
      className="bond-math-card rounded-2xl border border-primary/15 bg-surface-container-lowest/70 px-3 py-5 md:px-5"
    >
      <div className="bond-scrollbar overflow-x-auto">
        <math
          aria-hidden="true"
          display="block"
          className="bond-math mx-auto"
        >
          {children}
        </math>
      </div>
      {caption ? (
        <figcaption className="mt-4 border-t border-outline/10 pt-3 text-xs leading-5 text-on-surface-variant">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function Question({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-outline/5 bg-surface-container-low/50 p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-black text-[var(--md-sys-color-primary)] marker:content-none">
        <span>{question}</span>
        <ChevronDown
          size={18}
          className="mt-0.5 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-4 space-y-4 border-t border-outline/10 pt-4 text-sm leading-6 text-on-surface-variant">
        {children}
      </div>
    </details>
  );
}

export function BondEducation() {
  return (
    <main className="bond-app relative min-h-screen overflow-x-clip bg-background font-sans text-on-background">
      <ImigongoBackground />

      <header className="sticky top-0 z-50 border-b border-outline/5 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-4">
            <span className="hidden sm:block">
              <GaboBrand />
            </span>
            <span className="sm:hidden">
              <GaboBrand compact />
            </span>
            <span className="hidden h-5 w-px bg-outline/20 sm:block" />
            <span className="hidden text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant sm:block">
              Bond Education
            </span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/portfolio"
              className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container md:block"
            >
              Portfolio
            </Link>
            <Link
              href="/calendar"
              className="hidden rounded-xl px-3 py-2 text-xs font-black text-on-surface-variant hover:bg-surface-container sm:block"
            >
              Calendar
            </Link>
            <BondThemeToggle />
          </nav>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 md:px-8 md:pb-24 md:pt-24">
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-outline/10 bg-surface-container-lowest/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">
              <BookOpenText size={14} />
              No finance knowledge required
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
              Rwanda bonds
              <span className="block text-[var(--md-sys-color-primary)]">
                from absolute zero.
              </span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-on-surface-variant">
              Start here even if words such as coupon, par, yield, or maturity
              mean nothing to you yet. The course first explains borrowing and
              lending with one simple RWF 100,000 example. Each level then adds
              one new idea, repeats the important definitions in context, and
              gradually builds toward evaluating real Rwanda Treasury bonds on
              the Rwanda Stock Exchange.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                label: "Level 0",
                value: "Understand the promise",
                copy: "Who borrows, who lends, what gets paid, and when.",
              },
              {
                label: "Levels 1–2",
                value: "Understand the numbers",
                copy: "Face value, coupon cash, price, tax, and yield.",
              },
              {
                label: "Level 3 · Advanced",
                value: "Evaluate and execute",
                copy: "Compare listings, contact a broker, and place an order.",
              },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-5 backdrop-blur-xl"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-on-surface-variant">
                  {item.label}
                </p>
                <p className="mt-2 font-black text-[var(--md-sys-color-primary)]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="sticky top-[57px] z-40 border-y border-outline/10 bg-background/92 backdrop-blur-xl md:hidden">
        <nav
          aria-label="Education sections"
          className="bond-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3"
        >
          {anchors.map((anchor) => (
            <a
              key={anchor.id}
              href={`#${anchor.id}`}
              className="shrink-0 rounded-full border border-outline/10 bg-surface-container-lowest/70 px-4 py-2 text-[10px] font-black text-on-surface-variant"
            >
              {anchor.number} · {anchor.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-24 md:grid-cols-[220px_minmax(0,1fr)] md:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden md:block">
          <nav
            aria-label="Education sections"
            className="sticky top-28 rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-3 shadow-sm backdrop-blur-xl"
          >
            <p className="px-3 pb-3 pt-2 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">
              Learning path
            </p>
            {anchors.map((anchor) => (
              <a
                key={anchor.id}
                href={`#${anchor.id}`}
                className="group flex gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/10"
              >
                <span className="font-mono text-[10px] font-black text-[var(--md-sys-color-primary)]">
                  {anchor.number}
                </span>
                <span>
                  <span className="block text-xs font-black text-on-surface">
                    {anchor.label}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-on-surface-variant">
                    {anchor.detail}
                  </span>
                </span>
              </a>
            ))}
            <div className="mt-3 border-t border-outline/10 p-3">
              <p className="text-[10px] leading-5 text-on-surface-variant">
                Educational analysis only. Confirm live prices, settlement
                amounts, tax treatment, and security terms with the official
                prospectus and your broker.
              </p>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-24">
          <section id="start" className="scroll-mt-36">
            <LessonHeader
              eyebrow="Level 0 · Start here"
              title="A bond is a formal government I.O.U."
              introduction="Imagine lending money to someone who gives you a written promise showing how much they borrowed, when they will pay you interest, and the date they will return your original money. A Treasury bond is the Government version of that promise. It has more rules and an electronic ownership record, but the basic idea is still lending."
            />

            <div className="mt-9 space-y-5">
              <LessonCard
                icon={<Landmark size={20} />}
                kicker="First definition"
                title="What Is a Rwanda Treasury Bond?"
              >
                <p>
                  When the Government of Rwanda needs money for public
                  financing, it can issue Treasury bonds. The Government is the{" "}
                  <strong className="text-on-surface">issuer</strong>: it creates
                  the promise and owes the payments. You are the{" "}
                  <strong className="text-on-surface">investor</strong>: you
                  provide the money and receive the promised cash flows. You are
                  lending to the Government, not buying a piece of it.
                </p>
                <p>
                  The bond identifies how much principal exists, how interest is
                  calculated, when interest is scheduled to be paid, and when
                  principal is scheduled to be returned. Rwanda Treasury bonds
                  commonly pay interest twice per year, but each bond series has
                  its own exact dates. A buyer must read the prospectus or
                  confirmation for that particular series rather than assuming
                  that every bond pays in the same months.
                </p>
                <p>
                  Treasury bonds are often described as lower-credit-risk
                  investments because payment is backed by the Government.
                  Lower credit risk does not make every purchase price good and
                  does not make the account value permanently stable. If the
                  investor sells before maturity, the selling price can be above
                  or below the original purchase price. Inflation can also
                  reduce what future Rwandan francs can buy.
                </p>
                <p>
                  A familiar comparison is a brand-new high-end smartphone. The
                  manufacturer releases one model with fixed specifications, but
                  later owners may resell that same phone for different prices.
                  Someone who urgently needs cash might sell cheaply; strong
                  demand might push another resale price higher. A bond behaves
                  similarly on the secondary market: its face value, coupon, and
                  maturity stay attached to the bond, while the price buyers and
                  sellers agree to can move.
                </p>
                <Equation title="The whole bond in one sentence">
                  <p className="font-black">
                    You provide money now; the issuer promises interest on
                    scheduled dates and principal at maturity.
                  </p>
                </Equation>
              </LessonCard>

              <LessonCard
                icon={<CircleDollarSign size={20} />}
                kicker="One slow example"
                title="Follow RWF 100,000 from Purchase to Maturity"
              >
                <p>
                  Imagine a new Treasury bond with RWF 100,000 of face value, a
                  12% annual coupon rate, two coupon payments per year, and a
                  five-year maturity. For this first example, assume it is bought
                  at its original issue for exactly RWF 100,000 and ignore tax
                  and fees temporarily. Removing those extra details lets us see
                  the basic promise clearly.
                </p>
                <p>
                  The annual interest calculation is RWF 100,000 multiplied by
                  12%, which equals RWF 12,000 per year. Because payment happens
                  twice per year, each scheduled coupon is half of RWF 12,000,
                  or RWF 6,000. The investor does not normally receive a little
                  interest every day in the bank account. Interest accumulates
                  economically, but cash arrives on the scheduled coupon dates.
                </p>
                <p>
                  If the investor holds the bond for all five years and the
                  Government pays as agreed, the investor receives ten coupon
                  payments of RWF 6,000. Total gross coupon cash is therefore RWF
                  60,000. On the maturity date, the investor also receives the
                  RWF 100,000 principal. The principal repayment is not an extra
                  RWF 100,000 profit; it is the original amount lent being
                  returned.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "You provide",
                      value: "RWF 100,000",
                      copy: "The original amount lent in this simplified example.",
                    },
                    {
                      label: "You receive during 5 years",
                      value: "10 × RWF 6,000",
                      copy: "Gross semiannual coupons before tax.",
                    },
                    {
                      label: "You receive at maturity",
                      value: "RWF 100,000",
                      copy: "The principal is returned if payment occurs as agreed.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-outline/10 bg-surface-container-low/60 p-4"
                    >
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
                        {item.label}
                      </p>
                      <p className="mt-2 font-black text-[var(--md-sys-color-primary)]">
                        {item.value}
                      </p>
                      <p className="mt-2 text-xs leading-5">{item.copy}</p>
                    </div>
                  ))}
                </div>
                <Question question="Why can't I invest an arbitrary RWF 97,000 from the start? Why is it tied to the 100k unit rule?">
                  <p>
                    A Government bond is a standardized loan certificate, not a
                    savings account that accepts any balance. BNR auction notices
                    commonly structure non-competitive amounts in multiples of
                    RWF 100,000. You choose how many face-value blocks you want.
                  </p>
                  <p>
                    The market price of a block can move, just as a used
                    smartphone can resell above or below its launch price. A
                    block priced at 97 costs RWF 97,000 clean, but it remains a
                    RWF 100,000 face-value block in the securities record.
                  </p>
                  <div className="rounded-xl border border-primary/10 bg-primary-container/20 p-4">
                    <p className="font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                      1 block = RWF 100,000 face value<br />
                      5 blocks = RWF 500,000 face value<br />
                      At price 97, 5 blocks cost RWF 485,000 clean
                    </p>
                  </div>
                </Question>
              </LessonCard>

              <LessonCard
                icon={<BookOpenText size={20} />}
                kicker="Words you will see repeatedly"
                title="The Beginner Vocabulary"
              >
                <p>
                  <strong className="text-on-surface">Principal</strong> is the
                  amount borrowed and expected to be repaid at maturity.{" "}
                  <strong className="text-on-surface">Face value</strong> or{" "}
                  <strong className="text-on-surface">par value</strong> is the
                  principal amount printed in the bond records and used to
                  calculate coupon cash. In everyday discussion, these terms
                  often point to the same contractual amount.
                </p>
                <p>
                  <strong className="text-on-surface">Interest</strong> is the
                  compensation paid for using someone else&apos;s money. A{" "}
                  <strong className="text-on-surface">coupon</strong> is one
                  scheduled interest payment. The{" "}
                  <strong className="text-on-surface">coupon rate</strong> is the
                  annual percentage applied to face value to determine coupon
                  cash. A 12% coupon rate on RWF 100,000 face value means RWF
                  12,000 gross interest per full year, not necessarily a 12%
                  return on whatever market price a later buyer pays.
                </p>
                <p>
                  <strong className="text-on-surface">Maturity</strong> is the
                  contractual end date when principal is due.{" "}
                  <strong className="text-on-surface">Tenor</strong> describes
                  the bond&apos;s length, often measured from original issuance
                  to maturity. <strong className="text-on-surface">Remaining maturity</strong>{" "}
                  describes how much time is left today. A bond originally issued
                  with a 20-year tenor may have only 12 years remaining when you
                  discover it.
                </p>
                <p>
                  <strong className="text-on-surface">Price</strong> is what a
                  buyer must pay to acquire the bond. Price and face value can be
                  different after issuance.{" "}
                  <strong className="text-on-surface">Yield</strong> is a way of
                  expressing the return created by the cash flows relative to
                  the price paid. The coupon rate belongs to the bond; yield
                  changes when the market price or remaining time changes.
                </p>
              </LessonCard>

              <LessonCard
                icon={<ReceiptText size={20} />}
                kicker="Where a purchase happens"
                title="Primary Market, Secondary Market, Broker, and CSD"
              >
                <p>
                  The <strong className="text-on-surface">primary market</strong>{" "}
                  is where newly issued or reopened Government debt is offered.
                  The National Bank of Rwanda acts as fiscal agent in the
                  issuance process. Investors submit orders or bids through the
                  permitted channels, often with assistance from an intermediary
                  such as BK Capital. Money raised in the primary market goes
                  toward the Government financing operation.
                </p>
                <p>
                  The <strong className="text-on-surface">secondary market</strong>{" "}
                  is where an existing investor sells a bond to another investor
                  after issuance. The Government is not creating a new bond in
                  that trade. The buyer pays the seller through the market&apos;s
                  trading and settlement process. Because buyers and sellers
                  negotiate under current market conditions, an existing bond
                  can trade at 97, 100, 107, or another price.
                </p>
                <p>
                  A <strong className="text-on-surface">broker</strong> helps
                  communicate orders, locate available bonds, execute trades,
                  and provide a contract note or confirmation. The Central
                  Securities Depository, commonly shortened to{" "}
                  <strong className="text-on-surface">CSD</strong>, maintains
                  electronic ownership and supports settlement. You do not
                  normally receive a paper certificate that must be hidden at
                  home; ownership is recorded electronically.
                </p>
                <Equation title="Beginner checkpoint">
                  <p>
                    At this point, you only need four ideas: a bond is a loan,
                    coupons are interest payments, maturity is when principal is
                    due, and an existing bond&apos;s market price can differ from
                    its face value. The next level explains why that price
                    difference changes your real return.
                  </p>
                </Equation>
                <Question question="If an investor sells a RWF 100,000 bond block for 97k, can I pay 97k and still own 100k face value?">
                  <p>
                    Yes. Think of it like a high-end smartphone that originally
                    came with a fixed specification. A person who urgently needs
                    cash may resell that same phone for less, but the phone does
                    not lose its original storage capacity. Here, the previous
                    investor accepts RWF 97,000 clean for a bond block registered
                    with RWF 100,000 face value.
                  </p>
                  <p>
                    After settlement, the electronic ownership record moves to
                    your CSD account. Coupon cash and maturity principal follow
                    the RWF 100,000 face value, not the RWF 97,000 bargain price.
                    Your final debit can still include accrued interest and fees.
                  </p>
                  <div className="rounded-xl border border-primary/10 bg-primary-container/20 p-4">
                    <p className="font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                      Clean price: RWF 97,000<br />
                      Face value owned: RWF 100,000<br />
                      12% annual gross coupon: RWF 12,000<br />
                      Principal due at maturity: RWF 100,000
                    </p>
                  </div>
                </Question>
              </LessonCard>
            </div>
          </section>

          <section id="physics" className="scroll-mt-36">
            <LessonHeader
              eyebrow="Level 1 · Learn the numbers"
              title="Now separate the bond's promise from the price you pay."
              introduction="Level 0 used a new bond bought for exactly its face value. Real secondary-market purchases are less tidy. The bond keeps its original coupon and maturity date, but its price moves. This level introduces one distinction at a time: face value versus price, coupon rate versus yield, clean price versus total settlement cash, and gross coupon versus after-tax coupon."
            />

            <div className="mt-9 space-y-5">
              <LessonCard
                icon={<Scale size={20} />}
                kicker="Level 1.1 · Price"
                title="Face Value (Par) vs. Market Price"
              >
                <p>
                  <strong className="text-on-surface">Face value</strong>, also
                  called par value, is the number written on the bond&apos;s
                  official record. It is the amount used to calculate coupon
                  cash and the principal expected back at maturity. If you own
                  RWF 1,000,000 face value with a 12% coupon, the gross annual
                  coupon is RWF 120,000, even if you bought that position for
                  less or more than RWF 1,000,000.
                </p>
                <p>
                  Bond prices are commonly expressed as a percentage of par.
                  When an RSE or broker quote is identified as a clean price,
                  100 means RWF 100 of principal costs RWF 100 before accrued
                  interest and transaction charges. A clean price of 97 is a
                  discount: RWF 1,000,000 face value has a clean market cost of
                  RWF 970,000. A clean price of 107 is a premium: the same face
                  value has a clean market cost of RWF 1,070,000. The coupon
                  amount remains tied to RWF 1,000,000 face value, not to the
                  market cash paid.
                </p>
                <p>
                  At maturity, the issuer pays face value, not whatever price
                  you happened to pay another investor. Buy below 100 and you
                  can receive more principal than your clean purchase price.
                  Buy above 100 and part of your purchase price disappears when
                  principal returns to 100. This movement back toward face value
                  is called <strong className="text-on-surface">pull to par</strong>.
                </p>
                <Equation title="Translate a quoted price into clean cash">
                  <MathFormula
                    label="Clean consideration equals face value multiplied by quoted price divided by 100."
                    caption={
                      <>
                        <strong className="text-on-surface">Cclean</strong> is the
                        clean consideration, <strong className="text-on-surface">F</strong>{" "}
                        is face value, and <strong className="text-on-surface">q</strong>{" "}
                        is the quoted clean price.
                      </>
                    }
                  >
                    <mrow>
                      <msub>
                        <mi>C</mi>
                        <mtext>clean</mtext>
                      </msub>
                      <mo>=</mo>
                      <mi>F</mi>
                      <mo>×</mo>
                      <mfrac>
                        <mi>q</mi>
                        <mn>100</mn>
                      </mfrac>
                    </mrow>
                  </MathFormula>
                  <p className="mt-2">
                    For RWF 1,000,000 face at 107, the clean consideration is
                    RWF 1,070,000. That is not yet the final settlement amount:
                    accrued interest and broker or market charges may still be
                    added.
                  </p>
                </Equation>
              </LessonCard>

              <LessonCard
                icon={<BadgePercent size={20} />}
                kicker="Level 1.2 · Return"
                title="Coupon Rate vs. Yield to Maturity (YTM)"
              >
                <p>
                  The <strong className="text-on-surface">coupon rate</strong> is
                  the interest percentage printed on the bond. It determines
                  coupon cash by multiplying that percentage by face value.
                  With semiannual payments, a 13.5% bond with RWF 1,000,000 face
                  value pays RWF 67,500 gross every six months. The rate does
                  not adjust merely because the bond later trades above or
                  below 100.
                </p>
                <p>
                  <strong className="text-on-surface">Yield to maturity</strong>{" "}
                  is the fairer comparison number. It asks what annualized return
                  the whole deal represents when you include today&apos;s price,
                  every remaining coupon, and the principal paid at maturity. A
                  high-coupon bond bought at an expensive premium can therefore
                  have a lower YTM than a lower-coupon bond bought cheaply.
                </p>
                <Equation title="YTM in beginner language">
                  <p>
                    YTM asks: “If I pay this price today, receive all remaining
                    coupons, receive principal at maturity, and the issuer pays
                    as promised, what single annualized rate makes those cash
                    flows equivalent to my purchase price?” A lower purchase
                    price usually raises YTM. A higher purchase price usually
                    lowers YTM.
                  </p>
                </Equation>
                <p>
                  Quoted YTM is not a promise that the investor will realize
                  exactly that annual compound return. It normally assumes the
                  bond is held to maturity, every contractual payment occurs on
                  time, and interim coupons can be reinvested at a rate
                  consistent with the calculated yield. Selling early replaces
                  the known maturity payment with an unknown sale price.
                  Reinvesting coupons at lower rates reduces realized compound
                  return even when the issuer pays every coupon exactly as
                  scheduled.
                </p>
                <Equation title="The comparison equation">
                  <MathFormula
                    label="Dirty price equals the sum from t equals 1 to N of coupon at period t divided by one plus annual yield over two raised to period t, plus face value divided by one plus annual yield over two raised to N."
                    caption={
                      <>
                        <strong className="text-on-surface">Pdirty</strong> is the
                        dirty price, <strong className="text-on-surface">Ct</strong>{" "}
                        is the coupon paid in period t,{" "}
                        <strong className="text-on-surface">y</strong> is annual
                        YTM, <strong className="text-on-surface">N</strong> is the
                        number of semiannual periods remaining, and{" "}
                        <strong className="text-on-surface">F</strong> is face value.
                      </>
                    }
                  >
                    <mrow>
                      <msub>
                        <mi>P</mi>
                        <mtext>dirty</mtext>
                      </msub>
                      <mo>=</mo>
                      <munderover>
                        <mo>∑</mo>
                        <mrow>
                          <mi>t</mi>
                          <mo>=</mo>
                          <mn>1</mn>
                        </mrow>
                        <mi>N</mi>
                      </munderover>
                      <mfrac>
                        <msub>
                          <mi>C</mi>
                          <mi>t</mi>
                        </msub>
                        <msup>
                          <mrow>
                            <mo>(</mo>
                            <mn>1</mn>
                            <mo>+</mo>
                            <mfrac>
                              <mi>y</mi>
                              <mn>2</mn>
                            </mfrac>
                            <mo>)</mo>
                          </mrow>
                          <mi>t</mi>
                        </msup>
                      </mfrac>
                      <mo>+</mo>
                      <mfrac>
                        <mi>F</mi>
                        <msup>
                          <mrow>
                            <mo>(</mo>
                            <mn>1</mn>
                            <mo>+</mo>
                            <mfrac>
                              <mi>y</mi>
                              <mn>2</mn>
                            </mfrac>
                            <mo>)</mo>
                          </mrow>
                          <mi>N</mi>
                        </msup>
                      </mfrac>
                    </mrow>
                  </MathFormula>
                  <p className="mt-2">
                    For a semiannual bond, the model solves for annualized yield{" "}
                    <span className="font-mono">y</span>. A net-of-tax version
                    reduces coupon cash flows by applicable withholding tax
                    before solving. Principal repayment should not be casually
                    reduced by coupon withholding tax because it is a return of
                    principal rather than coupon interest.
                  </p>
                </Equation>
              </LessonCard>

              <LessonCard
                icon={<ReceiptText size={20} />}
                kicker="Level 1.3 · Settlement"
                title="Accrued Interest and Clean vs. Dirty Price"
              >
                <p>
                  Accrued interest sounds technical, but the household version
                  is simple. Imagine you move into a rented house on the 15th of
                  the month. At month-end, the electricity bill covers all 30
                  days. The previous tenant used electricity for the first half
                  of the month, so you should not keep the benefit of that whole
                  bill calculation for yourself. You settle up for the days they
                  were there.
                </p>
                <p>
                  Bonds have the same idea. Coupon interest builds up day by
                  day, but the cash is paid only on scheduled coupon dates. If
                  you buy from a seller halfway through a six-month coupon
                  period, the seller has already earned roughly half of that
                  coupon period. You usually pay them that earned portion on
                  settlement day. Later, when the full coupon arrives in your
                  account, part of it is really reimbursing money you already
                  advanced to the seller.
                </p>
                <p>
                  The <strong className="text-on-surface">clean price</strong>{" "}
                  is the simple market quote before that interest adjustment.
                  The <strong className="text-on-surface">dirty price</strong>{" "}
                  is the fuller settlement price after accrued interest is added.
                  Your final cash debit can also include broker commission and
                  other charges. So a clean quote of 101.50 is useful, but it is
                  not automatically the exact amount leaving your bank account.
                </p>
                <p>
                  The exact accrued-interest calculation depends on the
                  prospectus day-count convention, coupon-period dates, and
                  settlement date. A simplified actual-days illustration helps
                  explain the economics: assume RWF 1,000,000 face, a 12% annual
                  coupon, a RWF 60,000 gross semiannual coupon, and 90 elapsed
                  days in a 182-day coupon period. Approximate accrued interest
                  is RWF 60,000 x 90 / 182, or RWF 29,670. If the clean price is
                  101.50, clean consideration is RWF 1,015,000 and approximate
                  dirty consideration is RWF 1,044,670 before fees.
                </p>
                <Equation title="Why the next coupon is not free money">
                  <p>
                    If the buyer soon receives the full RWF 60,000 gross coupon,
                    approximately RWF 29,670 of that economic value was already
                    paid to the seller through accrued interest. Only the
                    post-settlement portion belongs economically to the buyer&apos;s
                    holding period. Treating the full next coupon as immediate
                    profit would double count the pre-purchase accrual.
                  </p>
                </Equation>
                <Question question="If I buy a bond right before a coupon date and get the next interest check almost immediately, is that free money?">
                  <p>
                    No. The coupon may arrive soon, but the seller did not give
                    away the interest they earned during the current six-month
                    cycle. On settlement day, you normally compensate the seller
                    for the days they already held the bond. When the full
                    coupon later lands in your account, part of it is simply the
                    system returning cash you advanced at purchase.
                  </p>
                  <div className="rounded-xl border border-primary/10 bg-primary-container/20 p-4">
                    <p className="font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                      Semiannual coupon: RWF 60,000<br />
                      Seller held roughly half the period<br />
                      Accrued interest paid to seller: about RWF 30,000<br />
                      Next coupon received by you: RWF 60,000 gross
                    </p>
                  </div>
                  <p>
                    The first coupon can feel exciting, but it is not pure
                    profit if you paid accrued interest upfront.
                  </p>
                </Question>
              </LessonCard>

              <LessonCard
                icon={<Landmark size={20} />}
                kicker="Level 1.4 · Tax"
                title="Rwandan Sovereign Withholding Tax Treatment"
              >
                <p>
                  Tax is removed before coupon cash reaches your account.
                  Rwanda&apos;s Law No. 027/2022 provides a reduced 5% withholding
                  treatment for interest from Treasury bonds with a maturity of
                  at least three years. That is why this planner normally shows
                  5% rather than the broader 15% withholding rate mentioned for
                  other covered payments.
                </p>
                <p>
                  For a qualifying Rwanda Treasury bond modeled at a 5%
                  withholding rate, a 12% gross coupon becomes an 11.4% annual
                  coupon cash rate after withholding: 12% x 95%. On RWF
                  1,000,000 face value, RWF 120,000 gross annual coupon becomes
                  RWF 114,000 net, normally split according to the security&apos;s
                  payment schedule. Tax reduces coupon cash; it does not change
                  the bond&apos;s contractual coupon printed in the prospectus.
                </p>
                <p>
                  Do not guess the tax from the countdown shown in a market
                  table. Confirm the bond&apos;s classification, current law, and
                  the broker or paying agent&apos;s treatment. Personal residence,
                  taxpayer status, and later legal changes can affect the answer.
                </p>
                <Equation tone="error" title="Tax is an input, not a permanent law of nature">
                  <p>
                    This page reflects official materials checked on June 7,
                    2026. Tax legislation and administrative interpretation can
                    change. Before committing capital, verify the current RRA
                    law, the prospectus, and the withholding shown by BK Capital
                    or the paying agent. The application uses 5% for its Rwanda
                    Treasury-bond projections, but a projection is not a tax
                    ruling.
                  </p>
                </Equation>
                <Question question="How exactly does the 5% withholding tax incentive work in Rwanda?">
                  <p>
                    Rwanda&apos;s income-tax law provides a reduced 5% withholding
                    treatment for interest from Treasury bonds with a maturity
                    of at least three years. In everyday terms, the tax is taken
                    out of the interest payment before the net coupon reaches
                    you. The bond still has the same gross coupon rate; your
                    cash account receives the amount after withholding.
                  </p>
                  <div className="rounded-xl border border-primary/10 bg-primary-container/20 p-4">
                    <p className="font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                      Raw semiannual interest: RWF 60,000<br />
                      Withholding tax at 5%: RWF 3,000<br />
                      Net cash received: RWF 57,000
                    </p>
                  </div>
                  <p>
                    Always confirm the current tax treatment from the prospectus,
                    RRA rules, and the broker confirmation, especially if your
                    taxpayer status is unusual.
                  </p>
                </Question>
              </LessonCard>
            </div>
          </section>

          <section id="bad-deals" className="scroll-mt-36">
            <LessonHeader
              eyebrow="Level 2 · Avoid bad deals"
              title="A large coupon can still produce a disappointing return."
              introduction="You now know that coupon rate and return are not the same number. This level combines price, time, tax, and maturity in worked examples. Read it slowly: each example begins with the attractive headline, identifies the hidden cost, and then explains how that cost changes the result."
            />

            <div className="mt-9 space-y-5">
              <LessonCard
                icon={<TrendingDown size={20} />}
                kicker="Level 2.1 · Worked scenario"
                title="The Premium Price Trap: 13.5% Coupon at 107"
              >
                <p>
                  Consider RWF 1,000,000 face value of a Treasury bond paying a
                  13.5% annual coupon in two semiannual installments. The annual
                  gross coupon is RWF 135,000, and each gross payment is RWF
                  67,500. At 5% withholding, annual coupon cash falls to RWF
                  128,250 and each net semiannual payment is RWF 64,125. Those
                  figures look attractive when viewed without the purchase
                  price.
                </p>
                <p>
                  Now assume the bond has approximately 3.2 years remaining and
                  trades at a clean price of 107. The investor pays RWF
                  1,070,000 clean for RWF 1,000,000 face value, before accrued
                  interest and fees. At maturity, the issuer repays RWF
                  1,000,000, not RWF 1,070,000. The RWF 70,000 premium is
                  gradually consumed through pull to par and becomes an
                  explicit capital loss at redemption. The high coupons must
                  first compensate for that loss before they produce excess
                  return.
                </p>

                <div className="bond-scrollbar overflow-x-auto rounded-3xl border border-outline/10">
                  <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                    <thead className="bg-surface-container text-[9px] uppercase tracking-[0.14em] text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-3">Simplified comparison</th>
                        <th className="px-4 py-3">13.5% bond</th>
                        <th className="px-4 py-3">11.5% bond</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline/10">
                      <tr>
                        <td className="px-4 py-3 font-black">Clean price</td>
                        <td className="px-4 py-3">107.00</td>
                        <td className="px-4 py-3">100.00</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-black">Remaining life</td>
                        <td className="px-4 py-3">Approx. 3.2 years</td>
                        <td className="px-4 py-3">Approx. 3.2 years</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-black">Approx. gross YTM</td>
                        <td className="px-4 py-3 font-black text-error">11.03%</td>
                        <td className="px-4 py-3 font-black text-[var(--md-sys-color-primary)]">11.50%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-black">Approx. after-tax YTM</td>
                        <td className="px-4 py-3 font-black text-error">10.39%</td>
                        <td className="px-4 py-3 font-black text-[var(--md-sys-color-primary)]">10.93%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-black">Principal at maturity</td>
                        <td className="px-4 py-3">RWF 1,000,000</td>
                        <td className="px-4 py-3">RWF 1,000,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p>
                  Under a simplified seven-period semiannual model, excluding
                  accrued interest and fees, the premium bond&apos;s approximate
                  gross YTM is 11.03% and its approximate after-tax yield is
                  10.39%. A par-priced 11.5% bond with the same simplified
                  remaining term produces an 11.5% gross yield and approximately
                  10.93% after coupon withholding. The supposedly more generous
                  13.5% coupon therefore delivers the lower modeled return
                  because the buyer overpays for the cash-flow stream and loses
                  the premium at maturity.
                </p>
                <Equation tone="error" title="Critical analytical rule">
                  <p className="font-black">
                    Never rank a secondary-market bond by coupon rate before
                    converting the quoted price and remaining cash-flow schedule
                    into YTM.
                  </p>
                  <p className="mt-2">
                    The exact result changes with settlement date, coupon dates,
                    accrued interest, fees, tax status, and day-count method.
                    The example demonstrates the mechanism; it is not a quote
                    for a particular security.
                  </p>
                </Equation>
                <Question question="Should I always buy the bond with the highest printed coupon rate?">
                  <p>
                    Absolutely not. The coupon is the attractive number printed
                    on the bond, but the purchase price decides how expensive
                    those coupons are for you. If a 13.5% bond trades at 107,
                    one RWF 1,000,000 face-value position costs RWF 1,070,000
                    clean. At maturity, the issuer returns RWF 1,000,000, so the
                    RWF 70,000 premium disappears through the pull back to par.
                  </p>
                  <div className="rounded-xl border border-error/10 bg-error-container/10 p-4 text-on-error-container">
                    <p className="font-black">The premium trap</p>
                    <p className="mt-2 font-mono text-xs leading-6">
                      Clean purchase price: RWF 1,070,000<br />
                      Principal returned at maturity: RWF 1,000,000<br />
                      Premium lost at maturity: RWF 70,000
                    </p>
                  </div>
                  <p>
                    Compare listings by Yield to Maturity, not coupon alone.
                    YTM combines the price you pay, every remaining coupon, and
                    the principal returned at maturity.
                  </p>
                </Question>
              </LessonCard>

              <LessonCard
                icon={<CalendarClock size={20} />}
                kicker="Level 2.2 · Time risk"
                title="Reinvestment Risk and Short Remaining Duration"
              >
                <p>
                  A bond can offer an excellent current YTM and still be a poor
                  fit for a long compounding objective. A security with only 3.2
                  years remaining returns principal relatively soon. The
                  investor then has to find a new home for that principal. If
                  market yields have fallen, the attractive rate cannot be
                  extended merely because the original bond once paid 13%.
                  This uncertainty is reinvestment risk.
                </p>
                <p>
                  Assume RWF 10,000,000 face value of a par-priced 13% bond with
                  3.2 years remaining. At 5% coupon withholding, its annual net
                  coupon rate is 12.35%, producing RWF 1,235,000 of net coupon
                  cash per full year while it remains outstanding. Compare it
                  with a par-priced 11.8% bond that can maintain a 15-year
                  exposure. The longer bond&apos;s annual net coupon rate is 11.21%,
                  producing RWF 1,121,000. The short bond initially pays RWF
                  114,000 more per year, but its rate disappears when principal
                  returns.
                </p>
                <p>
                  Suppose, purely as a stress scenario, that reinvestment
                  opportunities after year 3.2 offer only 8% gross, or 7.6%
                  after the same assumed withholding. A rough time-weighted rate
                  over a 15-year objective becomes approximately 8.61% for the
                  strategy that earns 12.35% for 3.2 years and 7.6% for the
                  remaining 11.8 years. The 15-year 11.8% bond preserves an
                  11.21% net coupon rate over the assumed horizon. This simple
                  comparison omits changing prices and detailed coupon
                  reinvestment, but it shows why a temporarily higher rate can
                  lose to a durable rate lock.
                </p>
                <Equation tone="error" title="Duration is not automatically good or bad">
                  <p>
                    Long maturity protects the investor from having to replace
                    principal quickly when rates fall, but it also creates
                    greater price sensitivity when rates rise. The appropriate
                    choice depends on the date the money will be needed,
                    tolerance for market-value fluctuations, and whether the
                    investor can genuinely hold to maturity. Long-term
                    compounding favors runway; near-term spending favors
                    matching maturity to the liability.
                  </p>
                </Equation>
                <Question question="What is reinvestment risk, and how can it ruin long-term compounding?">
                  <p>
                    Imagine finding a wonderful 13% bond that matures in only
                    two years. You enjoy that rate for 24 months, and then the
                    Government returns your principal. Now you must find a new
                    place for the money. If market rates have fallen to 8%, the
                    high-rate part of your plan is over.
                  </p>
                  <p>
                    A slightly lower 11.8% bond with 15 or 20 years remaining
                    may be more useful for a long-term income plan because the
                    rate stays attached to the principal for much longer. That
                    does not make long bonds universally better: their market
                    prices can move more, and they are unsuitable if you need
                    the money soon.
                  </p>
                  <div className="rounded-xl border border-error/10 bg-error-container/10 p-4 text-on-error-container">
                    <p className="font-black">The hidden question</p>
                    <p className="mt-2">
                      Do not ask only, “What rate do I get today?” Also ask,
                      “How soon will I be forced to find another investment?”
                    </p>
                  </div>
                </Question>
                <Question question="Starting with RWF 1,000,000 in a 12% Treasury bond, how long should it take to reach RWF 2,000,000 if I reinvest every net coupon? Please include the 5% tax, semiannual payments, the RWF 100,000 purchase unit, idle coupon cash, optional personal top-ups, and coupons pooled from other bonds.">
                  <p>
                    This is the clearer version of the question because it
                    separates four things that are easy to mix together: the
                    printed 12% coupon, the 5% tax on coupon cash, the fact that
                    coupons arrive only twice per year, and the rule that new
                    bond purchases must be made in RWF 100,000 face-value chunks.
                  </p>
                  <p>
                    After 5% withholding, the net annual coupon rate is 11.4%.
                    With two payments per year, each six-month payment is 5.7%
                    of the bond face value. Your first RWF 1,000,000 position
                    therefore pays RWF 57,000 net every six months.
                  </p>

                  <div className="rounded-xl border border-primary/10 bg-primary-container/20 p-4">
                    <p className="font-black text-on-surface">
                      Paper theory: fractional semiannual reinvestment
                    </p>
                    <div className="mt-3">
                      <MathFormula
                        label="The net six-month rate is 12 percent multiplied by one minus 5 percent tax, divided by 2, which equals 5.7 percent. To double, 2 equals 1.057 raised to n, so n equals the natural logarithm of 2 divided by the natural logarithm of 1.057, approximately 12.5 periods."
                        caption="n counts six-month coupon periods, not calendar years."
                      >
                        <mtable rowspacing="0.75em">
                          <mtr>
                            <mtd>
                              <msub>
                                <mi>r</mi>
                                <mtext>6m</mtext>
                              </msub>
                            </mtd>
                            <mtd>
                              <mo>=</mo>
                            </mtd>
                            <mtd>
                              <mfrac>
                                <mrow>
                                  <mn>0.12</mn>
                                  <mo>×</mo>
                                  <mo>(</mo>
                                  <mn>1</mn>
                                  <mo>−</mo>
                                  <mn>0.05</mn>
                                  <mo>)</mo>
                                </mrow>
                                <mn>2</mn>
                              </mfrac>
                              <mo>=</mo>
                              <mn>0.057</mn>
                            </mtd>
                          </mtr>
                          <mtr>
                            <mtd>
                              <mn>2</mn>
                            </mtd>
                            <mtd>
                              <mo>=</mo>
                            </mtd>
                            <mtd>
                              <msup>
                                <mrow>
                                  <mo>(</mo>
                                  <mn>1.057</mn>
                                  <mo>)</mo>
                                </mrow>
                                <mi>n</mi>
                              </msup>
                            </mtd>
                          </mtr>
                          <mtr>
                            <mtd>
                              <mi>n</mi>
                            </mtd>
                            <mtd>
                              <mo>=</mo>
                            </mtd>
                            <mtd>
                              <mfrac>
                                <mrow>
                                  <mi>ln</mi>
                                  <mo>(</mo>
                                  <mn>2</mn>
                                  <mo>)</mo>
                                </mrow>
                                <mrow>
                                  <mi>ln</mi>
                                  <mo>(</mo>
                                  <mn>1.057</mn>
                                  <mo>)</mo>
                                </mrow>
                              </mfrac>
                              <mo>≈</mo>
                              <mn>12.5</mn>
                            </mtd>
                          </mtr>
                        </mtable>
                      </MathFormula>
                    </div>
                    <div className="mt-3 space-y-2 font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                      <p>But cash is paid only on coupon dates</p>
                      <p>After 12 payments: about RWF 1,944,912</p>
                      <p>After 13 payments: about RWF 2,055,771</p>
                    </div>
                  </div>

                  <p>
                    The equation&apos;s decimal answer is approximately 6.25 years,
                    but you cannot reinvest half of a coupon period before the
                    coupon is paid. On an actual semiannual payment calendar,
                    perfect fractional reinvestment first passes RWF 2,000,000
                    at payment 13, around 6.5 years.
                  </p>

                  <p>
                    Now apply the RWF 100,000 purchase rule. At month six, the
                    RWF 57,000 coupon waits as cash. At month twelve, another RWF
                    57,000 raises cash to RWF 114,000, allowing one RWF 100,000
                    bond purchase and leaving RWF 14,000 idle. The same process
                    repeats, but the coupon grows as more RWF 100,000 blocks are
                    added.
                  </p>

                  <div className="rounded-xl border border-primary/10 bg-primary-container/20 p-4">
                    <p className="font-black text-on-surface">
                      Simplified RWF 100,000-lot result
                    </p>
                    <div className="mt-3 space-y-2 font-mono text-xs leading-6 text-[var(--md-sys-color-primary)]">
                      <p>Month 12: RWF 1,100,000 bonds + RWF 14,000 cash</p>
                      <p>Month 36: RWF 1,300,000 bonds + RWF 81,900 cash</p>
                      <p>Month 60: RWF 1,700,000 bonds + RWF 12,500 cash</p>
                      <p>Month 72: RWF 1,900,000 bonds + RWF 12,000 cash</p>
                      <p>Month 78: RWF 2,000,000 bonds + RWF 20,300 cash</p>
                    </div>
                  </div>

                  <p>
                    Under these simplified assumptions, the unassisted portfolio
                    also reaches RWF 2,000,000 of bond face value at month 78,
                    which is 6.5 years. Cash drag is still real: perfect
                    fractional reinvestment would be worth about RWF 2,055,771
                    at that point, while the chunked strategy is about RWF
                    2,020,300. The minimum-unit rule costs roughly RWF 35,471 of
                    modeled value by that date, but it does not push this
                    particular first doubling into year seven.
                  </p>

                  <div className="rounded-xl border border-error/10 bg-error-container/10 p-4 text-on-error-container">
                    <p className="font-black">
                      Be careful when adding personal top-ups
                    </p>
                    <p className="mt-2">
                      Adding your own cash to complete each RWF 100,000 block is
                      a useful strategy because it keeps coupons invested. It can
                      make the account balance reach RWF 2,000,000 earlier.
                      However, part of that second million came from your new
                      contributions. That is not the same as the original RWF
                      1,000,000 doubling from investment returns alone.
                    </p>
                  </div>

                  <p>
                    Pooling coupons from several bonds, using income from other
                    investments, or staggering coupon dates can improve the
                    percentage of cash that stays invested and reduce the
                    average waiting time. As the portfolio becomes larger, a
                    leftover below RWF 100,000 becomes a smaller percentage of
                    total wealth, so performance moves closer to the theoretical
                    line. A practical planning estimate is therefore{" "}
                    <strong className="text-on-surface">
                      approximately 6.5 years without extra contributions
                    </strong>
                    , assuming 12% gross coupon, 5% withholding, stable
                    reinvestment at similar rates, immediate RWF 100,000 purchases
                    when cash permits, and no fees or price premiums.
                  </p>
                </Question>
              </LessonCard>

              <LessonCard
                icon={<ShieldAlert size={20} />}
                kicker="Level 2.3 · Suitability"
                title="A Yield Can Be Correct and the Purchase Can Still Be Wrong"
              >
                <p>
                  YTM is a return calculation, not a complete suitability test.
                  A high YTM may be compensation for poor liquidity, a stale
                  quote, unusual settlement terms, credit uncertainty outside
                  sovereign debt, or a maturity date that conflicts with the
                  investor&apos;s cash needs. A screen that ranks yield correctly can
                  still encourage a bad decision if the investor ignores the
                  conditions under which that yield is realizable.
                </p>
                <p>
                  A displayed closing price may represent a small historical
                  trade rather than a currently executable offer. An investor
                  should distinguish the last traded price, the broker&apos;s current
                  ask, and the final all-in settlement amount. A model using
                  97.00 can overstate return if the available seller requires
                  100.50, or if accrued interest and fees are omitted. Likewise,
                  a published RSE YTM can become stale when no new trade resets
                  the market price.
                </p>
                <p>
                  The final discipline is matching the bond to your real-life
                  need for cash. Money reserved for school fees in four years
                  should not be placed reflexively
                  into a 20-year bond merely because its strategy score is
                  higher. Selling before maturity exposes the investor to the
                  market price then available. Government payment reliability
                  reduces credit risk, but it does not eliminate interest-rate
                  risk, inflation risk, liquidity risk, execution risk, or the
                  personal risk of needing cash at an inconvenient time.
                </p>
              </LessonCard>

            </div>
          </section>

          <section id="alpha-deals" className="scroll-mt-36">
            <LessonHeader
              eyebrow="Level 3 · Execute the deal"
              title="Move from understanding a bond to placing an order."
              introduction="You do not need to operate the market's professional systems yourself. Your job is to identify the bond, decide the face-value amount you want, understand the likely price and risks, and give clear instructions to a licensed intermediary. The broker or authorized bank channel handles the market and CSD workflow on your behalf."
            />

            <div className="mt-9 space-y-5">
              <LessonCard
                icon={<ReceiptText size={20} />}
                kicker="Level 3.1 · Your buying path"
                title="From an RSE Listing to a Confirmed Purchase"
              >
                <p>
                  Start by opening or confirming your investment and CSD account
                  details with a licensed intermediary. CMA&apos;s public licensee
                  list includes securities brokers and investment banks such as
                  BK Capital. BNR auction notices explain that authorized bank
                  treasurers and brokers use the CSD platform to submit bids for
                  their clients.
                </p>
                <p>
                  For a primary auction or reopening, ask for the official notice
                  and prospectus. Decide how much face value you want, whether
                  your instruction is competitive or non-competitive where
                  applicable, and the deadline for making funds available. For a
                  secondary-market purchase, ask for a current executable offer,
                  the face value available, accrued interest, fees, settlement
                  date, and total cash required.
                </p>
                <p>
                  Do not fund a trade from a website screenshot alone. The RSE
                  closing price is useful market information, but the broker must
                  confirm whether a seller is currently available and the final
                  all-in settlement amount. Keep the order email, prospectus,
                  contract note, payment proof, and CSD record together.
                </p>
                <Question question="Can I buy these bonds myself electronically, or do I need an intermediary?">
                  <p>
                    As an individual, you normally give the order through an
                    authorized market intermediary or bank channel rather than
                    logging directly into the professional CSD bidding interface.
                    BNR auction notices state that authorized commercial-bank
                    treasurers and brokers submit CSD bids for their clients.
                  </p>
                  <p>
                    BK Capital appears on CMA&apos;s licensee list as an investment
                    bank. Other licensed intermediaries also exist, so verify the
                    current CMA licensee list before sending money or identity
                    documents. The intermediary can help open or reference your
                    CSD account, clarify the order type, confirm settlement
                    funding, and provide the trade confirmation.
                  </p>
                  <div className="rounded-xl border border-error/10 bg-error-container/10 p-4 text-on-error-container">
                    <p className="font-black">Protect the order</p>
                    <p className="mt-2">
                      Use verified contact details from the institution or CMA
                      licensee list. Do not send funds to an account supplied
                      only through an unverified message.
                    </p>
                  </div>
                </Question>
                <Question question="What is the simplest way to start a trade by email with BK Capital?">
                  <p>
                    Send a clear instruction that identifies you, your CSD
                    account, the exact security, the order type, and the desired
                    face value. Ask the trading desk to confirm the price or
                    auction terms, fees, accrued interest, settlement amount,
                    deadline, funding method, and documents before execution.
                  </p>
                  <CopyOrderTemplate />
                  <p>
                    This is a communication template, not proof that an order has
                    been accepted. Replace every placeholder, verify the ticker
                    against the current official notice, and wait for BK Capital
                    to confirm the instructions and settlement amount.
                  </p>
                </Question>
              </LessonCard>

              <LessonCard
                icon={<Search size={20} />}
                kicker="Level 3.2 · Secondary market"
                title="Spotting Discount Sovereigns Below Par"
              >
                <p>
                  Start with the RSE Fixed Income Board to identify the bond
                  code, issue date, maturity date, coupon rate, and published
                  YTM. Then cross-check the RSE Bond Market page for a recent
                  closing price, trade volume, and value. A Treasury bond below
                  100 deserves investigation because the investor receives the
                  contractual coupons and, if held to maturity and paid as
                  agreed, receives 100 of principal for less than 100 of clean
                  purchase price.
                </p>
                <p>
                  Consider a 15-year remaining bond with an 11.5% coupon trading
                  at 97. For RWF 1,000,000 face value, clean consideration is RWF
                  970,000. The annual gross coupon remains RWF 115,000, or RWF
                  109,250 after an assumed 5% withholding rate. At maturity, the
                  investor receives RWF 1,000,000, adding RWF 30,000 of
                  pull-to-par value relative to the clean purchase price. In a
                  simplified semiannual model, gross YTM rises to approximately
                  11.93% and after-tax YTM to approximately 11.35%, both above
                  the nominal coupon comparison implied by price 100.
                </p>
                <p>
                  The discount is not automatically a bargain. It may reflect
                  higher market yields, a seller&apos;s liquidity need, weak trading
                  depth, or a quote that is no longer executable. Before treating
                  the discount as opportunity, request a live bid or offer from
                  BK Capital, confirm face value available, settlement date,
                  accrued interest, commission, and any custody charges. Re-run
                  YTM using the all-in dirty cash amount rather than the website
                  closing price alone.
                </p>
                <Equation title="Discount return has two engines">
                  <MathFormula
                    label="Hold-to-maturity return equals the sum of net coupons plus face value minus clean purchase price, minus costs."
                    caption="The pull-to-par term is positive when the clean purchase price is below face value."
                  >
                    <mrow>
                      <msub>
                        <mi>R</mi>
                        <mtext>hold</mtext>
                      </msub>
                      <mo>=</mo>
                      <munderover>
                        <mo>∑</mo>
                        <mrow>
                          <mi>t</mi>
                          <mo>=</mo>
                          <mn>1</mn>
                        </mrow>
                        <mi>N</mi>
                      </munderover>
                      <msubsup>
                        <mi>C</mi>
                        <mi>t</mi>
                        <mtext>net</mtext>
                      </msubsup>
                      <mo>+</mo>
                      <mo>(</mo>
                      <mi>F</mi>
                      <mo>−</mo>
                      <msub>
                        <mi>P</mi>
                        <mtext>clean</mtext>
                      </msub>
                      <mo>)</mo>
                      <mo>−</mo>
                      <mi>K</mi>
                    </mrow>
                  </MathFormula>
                  <p className="mt-2">
                    A discount increases yield because coupon cash is earned on
                    face value while less clean capital is paid, and because par
                    redemption exceeds the clean purchase price. Both effects
                    must still be placed on the correct dates to calculate YTM.
                  </p>
                </Equation>
              </LessonCard>

              <LessonCard
                icon={<Landmark size={20} />}
                kicker="Level 3.3 · Primary market"
                title="How Re-opened BNR Issues Work"
              >
                <p>
                  A reopening allows the Government of Rwanda, through the
                  National Bank of Rwanda, to issue an additional amount of an
                  existing Treasury-bond series instead of creating an entirely
                  new bond. The reopened tranche normally keeps the existing
                  series&apos; coupon rate and final maturity date. Because time has
                  passed since the original issue and market yields may have
                  changed, investors compete through the auction price or yield
                  rather than receiving a newly reset coupon.
                </p>
                <p>
                  Imagine a 20-year FXD series originally issued with a 13.15%
                  coupon. If BNR reopens it later, the additional bonds may have
                  roughly 19 years remaining but still pay the original 13.15%
                  coupon and mature on the original date. If prevailing required
                  yield is below 13.15%, successful pricing may be above par. If
                  required yield is above the coupon, pricing may be below par.
                  The coupon headline therefore does not reveal the auction
                  return; the accepted dirty price and resulting yield do.
                </p>
                <p>
                  Reopenings can make an existing bond series larger and easier
                  to trade. They also let an investor buy long-dated cash flows
                  without waiting for a brand-new maturity. Through a broker
                  such as BK Capital,
                  the investor should obtain the official reopening prospectus,
                  auction timetable, bond code and ISIN, coupon dates, remaining
                  tenor, minimum denomination, bidding instructions, settlement
                  amount, and published auction result. The investor should
                  verify that the new allocation is truly the same bond series
                  rather than assuming it solely from a similar name.
                </p>
                <Equation title="Reopening decision">
                  <p>
                    Focus on the auction yield and total settlement cash. A
                    reopening with a 13.15% coupon can be less attractive than a
                    new 12% bond if competitive demand pushes its price high
                    enough. Conversely, a reopened high-coupon series offered at
                    a reasonable price can provide a strong long-duration yield
                    and a larger, potentially more actively traded issue.
                  </p>
                </Equation>
              </LessonCard>

              <LessonCard
                icon={<Calculator size={20} />}
                kicker="Level 3.4 · Full analysis"
                title="A Full RSE-to-Broker Evaluation Process"
              >
                <ol className="space-y-6">
                  {[
                    {
                      title: "Establish the exact security identity.",
                      copy: "Record the full bond name, ISIN or security code, original issue date, final maturity date, coupon rate, coupon frequency, and whether the row is an original issue or reopening. Similar FXD labels are not interchangeable, and two rows with similar coupons can have materially different remaining lives.",
                    },
                    {
                      title: "Separate live execution data from reference data.",
                      copy: "Treat the Fixed Income Board coupon and published YTM as reference fields. Look for a recent closing price and trading activity on the Bond Market page, then ask the broker for an executable quote. Record the observation time because a price without a timestamp can mislead.",
                    },
                    {
                      title: "Build the remaining cash-flow calendar.",
                      copy: "List every future coupon date and the maturity principal. Do not assume all Rwanda Treasury bonds pay in January and July; each issuance follows its own schedule. Determine whether settlement occurs before or after the record-date conventions used by the paying system.",
                    },
                    {
                      title: "Calculate clean, accrued, dirty, and all-in cost.",
                      copy: "Convert quoted price into clean consideration, add accrued interest, then add broker commission and other confirmed charges. The all-in debit is the correct initial cash outflow for investor return calculations.",
                    },
                    {
                      title: "Solve gross and after-tax YTM.",
                      copy: "Use the actual settlement date and remaining payments. Solve once with contractual gross coupons and once with coupons reduced by the applicable withholding assumption. If no recent price exists, label any published-YTM tax adjustment as an approximation rather than a fully repriced result.",
                    },
                    {
                      title: "Measure runway and reinvestment exposure.",
                      copy: "Compare remaining maturity with the investor's objective. A high yield with three years left may be useful for a three-year liability but weak for a 20-year income plan. A long bond locks the rate longer but carries greater price volatility if sold before maturity.",
                    },
                    {
                      title: "Stress the decision rather than admiring one number.",
                      copy: "Recalculate at a higher purchase price, lower reinvestment rate, earlier forced-sale date, and delayed execution. Ask how much of the expected return comes from coupons, discount accretion, or an assumption that cannot be guaranteed.",
                    },
                    {
                      title: "Preserve the evidence after purchase.",
                      copy: "Store the broker confirmation, prospectus, settlement amount, accrued interest, fees, tax withheld, coupon dates, and maturity date in the private portfolio. Tracking actual cash flows against the original expected schedule turns a theoretical yield into an auditable investment record.",
                    },
                  ].map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-[10px] font-black text-on-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="font-black text-on-surface">
                          {step.title}
                        </h4>
                        <p className="mt-1">{step.copy}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </LessonCard>

              <div className="grid gap-5 md:grid-cols-2">
                <article className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-6">
                  <TrendingUp
                    size={22}
                    className="text-[var(--md-sys-color-primary)]"
                  />
                  <h3 className="mt-5 text-xl font-black text-on-surface">
                    Evidence of potential relative value
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                    A recent executable price below par, an after-tax YTM that
                    remains strong after all costs, a long remaining runway,
                    adequate issue size, confirmed coupon dates, and a maturity
                    aligned with the investor&apos;s plan together form a stronger
                    case than any single high coupon.
                  </p>
                </article>
                <article className="rounded-3xl border border-error/20 bg-error-container/10 p-6">
                  <ShieldAlert size={22} className="text-error" />
                  <h3 className="mt-5 text-xl font-black text-on-surface">
                    Evidence that the apparent bargain may be false
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                    A stale closing price, no available seller, large accrued
                    interest, an expensive premium, short remaining life,
                    conflicting security identifiers, uncertain payment dates,
                    or a maturity that forces an early sale can erase the
                    screen&apos;s apparent advantage.
                  </p>
                </article>
              </div>

            </div>
          </section>

          <section
            aria-labelledby="official-sources"
            className="rounded-3xl border border-outline/10 bg-surface-container-lowest/70 p-6 md:p-8"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-[var(--md-sys-color-primary)]">
                <CircleDollarSign size={20} />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--md-sys-color-primary)]">
                  Primary references
                </p>
                <h2
                  id="official-sources"
                  className="mt-1 text-2xl font-black text-on-surface"
                >
                  Verify the instrument before funding the trade.
                </h2>
              </div>
            </div>
            <p className="mt-5 max-w-4xl text-sm leading-7 text-on-surface-variant">
              Market pages can change, and a broker quote can differ from the
              last published trade. Use these official sources to validate the
              live market row, issuance documents, auction result, and current
              tax law. For a real purchase, the prospectus and broker
              confirmation control the transaction details, not an educational
              example on this page.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "RSE Fixed Income Board",
                  href: "https://www.rse.rw/fixed-income-board",
                  copy: "Bond codes, maturity dates, coupon rates, and published YTM.",
                },
                {
                  label: "RSE Bond Market",
                  href: "https://www.rse.rw/bond-market",
                  copy: "Recent closing prices, trading volume, and market value.",
                },
                {
                  label: "BNR Money Market Instruments",
                  href: "https://www.bnr.rw/mminstruments",
                  copy: "Prospectuses, reopening notices, calendars, and auction results.",
                },
                {
                  label: "RRA Income Tax Laws",
                  href: "https://www.rra.gov.rw/en/taxes-fees/domestic-taxes/income-tax/about-income-tax",
                  copy: "The 2022 income-tax law and its 2023 and 2025 amendments.",
                },
              ].map((source) => (
                <a
                  key={source.href}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-outline/10 bg-surface-container-low/60 p-5 transition hover:border-primary/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-on-surface">
                      {source.label}
                    </h3>
                    <ExternalLink
                      size={14}
                      className="shrink-0 text-outline group-hover:text-primary"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                    {source.copy}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-primary/20 bg-primary/5 p-7 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--md-sys-color-primary)]">
              Put the mechanics to work
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-on-surface md:text-4xl">
              Compare the lesson with live RSE listings, then model the cash
              flows.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-on-surface-variant">
              The market table calculates an after-tax yield estimate, remaining
              maturity, price score, data confidence, and long-term strategy
              score. The simulator then shows how repeated purchases and coupon
              reinvestment may develop over time. Neither replaces a current
              executable quote or the official prospectus.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-black text-on-primary"
              >
                Open my portfolio <ArrowRight size={16} />
              </Link>
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 rounded-2xl border border-outline/15 bg-surface-container-lowest/70 px-5 py-3.5 text-sm font-black text-on-surface hover:border-primary/35 hover:text-primary"
              >
                Open the simulator <Calculator size={16} />
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-outline/10 bg-surface-container-lowest/30">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 md:flex-row md:items-center md:px-8">
          <GaboBrand />
          <p className="max-w-xl text-xs leading-5 text-on-surface-variant md:text-right">
            Rwanda Treasury Bond Lab · Detailed educational material, analytical
            simulations, and private position tracking
          </p>
        </div>
      </footer>
    </main>
  );
}
