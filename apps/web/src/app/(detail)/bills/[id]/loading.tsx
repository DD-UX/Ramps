import { cn } from '@ramps/ui/cn';
import { DraggablePanel } from '@ramps/ui/DraggablePanel';
import { ArrowLeft } from '@ramps/ui/icons';
import { Skeleton } from '@ramps/ui/Skeleton';
import { Tabs } from '@ramps/ui/Tabs';
import Link from 'next/link';

import { BillDetailsPane } from '@/features/bill-details/components/BillDetailsPane';
import { BillDetailsSection } from '@/features/bill-details/components/BillDetailsSection';
import {
  BILL_DETAILS_DOCUMENT_TAB,
  BILL_DETAILS_DOCUMENT_TABS,
  BILL_DETAILS_TAB,
  BILL_DETAILS_TABS,
} from '@/features/bill-details/constants/tabs.constants';

/**
 * The bill-detail loading boundary — what shows between clicking a bill (from
 * the list or from the rail) and its four queries resolving.
 *
 * ## The rule
 *
 * Anything already known at build time is rendered FOR REAL; only what the
 * RECORD decides is a bar. A skeleton that greys out text it already knows is a
 * skeleton that reflows when the text appears — which is the exact complaint
 * this work exists to answer. So the section titles, both tab bars, the
 * "← Bill Pay" escape hatch and the Prev/Next words are real; vendor names,
 * amounts, dates, the invoice PDF and the status-driven action buttons are bars.
 *
 * ## Why it mirrors the real DOM this closely
 *
 * This screen's chrome is heavy — three fixed bands (the rail's 3.1rem top row,
 * the pane header and the two h-12 tab bars all sit on shared lines) and two
 * h-14 floors (the rail's Prev/Next and the form's action bar level with each
 * other across the border). Skeletonising the *content* while getting the
 * *frame* wrong is worse than no skeleton: the page visibly re-seats on resolve.
 * So the frame here is not an approximation of the real screen, it is largely
 * the real components:
 *
 * • {@link DraggablePanel} at the same `defaultSplit={60}` — same rounded frame,
 *   same limestone right pane, same grip position, so the split never jumps.
 * • {@link BillDetailsPane} — the `px-rui-5 py-rui-4` rhythm from one source
 *   rather than re-spelled here and drifting the first time it changes.
 * • {@link BillDetailsSection} — real titles, real typography, real spacing.
 * • The real {@link Tabs} bar with the real label constants, so the underline
 *   lands on "Overview" / "Invoice" before the data does and stays put.
 *
 * The tab bars are wrapped `inert`: they are pixel-identical to the live ones,
 * but a click can't select a tab that has nothing behind it yet, and they stay
 * out of the tab order. Present and honest, rather than a dead control dressed
 * up as a live one. "← Bill Pay" is the deliberate exception — the one thing a
 * user is most likely to want during a slow load is OUT, and a skeletonised
 * escape hatch is a trap, so it is the only working control on the screen.
 *
 * Prev/Next render in their disabled form for the same reason they do on a real
 * cold rail: until the category is loaded there is no neighbour to step to, and
 * offering the hop would be offering a link to nowhere.
 *
 * Where the fidelity deliberately STOPS is field labels. Section titles are the
 * page's visual anchors and belong to this layout; per-field labels belong to
 * the seven field components, and reaching into them would couple the skeleton
 * to every one of them — a drift surface far larger than the shift it removes.
 *
 * ## How far the match actually holds
 *
 * Measured skeleton-vs-resolved at 1440x900 (throttled hard navigation, so the
 * streamed shell paints before the content): all thirteen frame landmarks — the
 * rail and its three bands, the panel, handle and both panes, the header band,
 * title row, both tab bars and the action floor — land at 0px. Section titles
 * hold exactly down to `Line items`.
 *
 * Below that they cannot, and no amount of tuning changes it: `Line items` is
 * sized by the record, so a bill with more than the three rows guessed here
 * pushes everything under it down. That is off-screen at this viewport and only
 * reachable by scrolling, which is the right place to spend the inaccuracy —
 * the alternative is guessing a row count, which is wrong just as often and
 * wrong further up the page.
 */
export default function BillDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading bill"
      className="min-h-0 grid h-full flex-1 grid-cols-[16rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]"
    >
      <RailSkeleton />

      {/* The content column, mirroring page.tsx's grid cell and the split body
          BillDetailsContent renders inside it. */}
      <div className="min-h-0 min-w-0 flex flex-col">
        <div className="bg-white min-h-0 flex flex-1 flex-col">
          <div className="gap-rui-4 min-h-0 flex flex-1 flex-col">
            <DraggablePanel
              className="min-h-0 flex-1"
              defaultSplit={60}
              left={<FormPaneSkeleton />}
              right={<DocumentPaneSkeleton />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The rail — BillDetailsRail's exact frame: the 3.1rem top row with its 2px
 * stone underline, a scrolling body of status sections, and the h-14 Prev/Next
 * floor that levels with the form's action bar across the border.
 *
 * Which status sections appear depends on the bill's category, so the headings
 * are bars; two sections of three cards is the common shape and, being inside
 * the same `overflow-auto` nav, an over- or under-count costs nothing.
 */
function RailSkeleton() {
  return (
    <aside className="border-bone gap-rui-4 w-64 bg-white flex shrink-0 flex-col border-r">
      <div className="px-rui-4 border-stone flex h-[3.1rem] shrink-0 items-center border-b-2">
        {/* Real, and real navigation — the escape hatch must survive the wait. */}
        <Link
          href="/bills"
          className="gap-rui-2 text-ink text-sm font-medium flex items-center hover:underline"
        >
          <ArrowLeft size={16} />
          Bill Pay
        </Link>
      </div>

      <nav className="px-rui-2 pb-rui-3 gap-rui-4 min-h-0 flex flex-1 flex-col overflow-hidden">
        {[0, 1].map((section) => (
          <div key={section} className="gap-rui-1 flex flex-col">
            {/* h-4 is the real h3's line box (text-xs) — the heading's slot is
                the same height whether it holds a bar or the status word. */}
            <span className="px-rui-2 h-4 flex items-center">
              <Skeleton className="h-2.5 w-24" />
            </span>
            <div className="gap-rui-1 flex flex-col">
              {[0, 1, 2].map((row) => (
                // BillDetailsRailItem: avatar + name over due date, same padding.
                <div key={row} className="gap-rui-2 p-rui-2 flex items-center">
                  <Skeleton circle className="size-6 shrink-0" />
                  <div className="gap-rui-1 min-w-0 flex flex-1 flex-col">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* BillDetailsRailNav's floor, in the disabled form it takes at the ends
          of the list: there is no neighbour to step to until the rail loads. */}
      <div className="border-bone px-rui-4 h-14 flex shrink-0 items-center justify-between border-t">
        <span className="text-hushed text-sm" aria-disabled="true">
          Prev
        </span>
        <span className="text-hushed text-sm" aria-disabled="true">
          Next
        </span>
      </div>
    </aside>
  );
}

/**
 * The left pane — BillDetailsForm's column: pinned identity band, the big
 * title, the Overview/Activity bar, the seven coding sections, and the sticky
 * h-14 action bar. Same `gap-rui-4 flex h-full flex-col` the <form> uses, so the
 * bands land on the same lines they will after resolve.
 */
function FormPaneSkeleton() {
  return (
    <div className="gap-rui-4 flex h-full flex-col">
      {/* BillDetailsHeader — avatar · status word · title, all record-derived. */}
      <div className="gap-rui-2 px-rui-5 border-bone top-0 h-12 bg-white sticky z-20 flex shrink-0 items-center border-b">
        <Skeleton circle className="size-6 shrink-0" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* BillDetailsTitle. The SLOT is h-12 because this design system themes
          `text-3xl` to 40px/48px — not Tailwind's default 36px line box, which
          is what an eyeballed skeleton reaches for and is how this row was
          pushing the tab bar 12px up until the whole record landed. The bar
          inside is deliberately shorter than its slot: a 48px slab reads as a
          block, not a heading. */}
      <BillDetailsPane className="py-0">
        <span className="h-12 flex items-center">
          <Skeleton className="h-8 w-72" />
        </span>
      </BillDetailsPane>

      <InertTabs tabs={BILL_DETAILS_TABS} value={BILL_DETAILS_TAB.OVERVIEW} />

      <BillDetailsPane>
        <BillDetailsSection title="Vendor">
          <div className="gap-rui-2 grid">
            <SkeletonField />
            <SkeletonField />
          </div>
        </BillDetailsSection>

        <BillDetailsSection title="Bill details">
          <div className="gap-rui-4 grid grid-cols-2">
            {/* Invoice number spans, then the two dates share the row. */}
            <SkeletonField className="col-span-full" />
            <SkeletonField />
            <SkeletonField />
          </div>
        </BillDetailsSection>

        <BillDetailsSection title="Purchase order">
          <div className="gap-rui-2 grid">
            <SkeletonField />
          </div>
        </BillDetailsSection>

        <BillDetailsSection title="Line items">
          <div className="rounded-square border-bone bg-white overflow-hidden border">
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="gap-rui-3 border-bone p-rui-3 flex items-start border-b last:border-b-0"
              >
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        </BillDetailsSection>

        <BillDetailsSection title="Payment details">
          <div className="gap-rui-4 grid grid-cols-2">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
        </BillDetailsSection>

        <BillDetailsSection title="Memo for vendor">
          {/* The real control is a rows={3} textarea. */}
          <Skeleton className="h-20 w-full" />
        </BillDetailsSection>

        <BillDetailsSection title="Approvals">
          <div className="gap-rui-3 flex flex-col">
            {[0, 1].map((stage) => (
              <div key={stage} className="gap-rui-3 flex items-center">
                <Skeleton circle className="size-8 shrink-0" />
                <div className="gap-rui-1 min-w-0 flex flex-1 flex-col">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </BillDetailsSection>
      </BillDetailsPane>

      {/* The sticky action bar. Both slots are status-driven (Save draft / Edit
          bill on the left, Approve / Schedule / View on the right), so they are
          bars — but the h-14 band they sit in is real, which is what keeps this
          floor level with the rail's Prev/Next while the page loads. */}
      <BillDetailsPane className="border-bone bg-white/80 backdrop-blur h-14 py-0 sticky -bottom-px z-10 mt-auto grid shrink-0 grid-flow-col items-center justify-between border-t">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </BillDetailsPane>
    </div>
  );
}

/**
 * The right pane — BillDetailsDocument's column: the Invoice/Documents bar over
 * the bordered viewer frame. The frame's `min-h-[32rem]` is copied from the real
 * iframe so the pane doesn't grow when the PDF mounts.
 */
function DocumentPaneSkeleton() {
  return (
    <div className="gap-rui-3 flex h-full flex-col">
      <InertTabs tabs={BILL_DETAILS_DOCUMENT_TABS} value={BILL_DETAILS_DOCUMENT_TAB.INVOICE} />
      <BillDetailsPane className="h-full">
        <div className="rounded-square border-bone flex-1 overflow-hidden border">
          <Skeleton className="h-full min-h-[32rem] w-full rounded-none" />
        </div>
      </BillDetailsPane>
    </div>
  );
}

/**
 * The real {@link Tabs} bar, made inert.
 *
 * Using the real component (with the real label constants) is what guarantees
 * the band's height, padding and the active underline are exactly where the
 * live bar will put them — a hand-rolled lookalike would be a second copy of
 * the tab DOM, drifting the first time either changes.
 *
 * `inert` on a `display: contents` wrapper keeps the bar a direct flex child of
 * the pane column while removing it from the tab order and swallowing clicks:
 * selecting a tab whose body hasn't loaded would be a control that lies.
 */
function InertTabs({
  tabs,
  value,
}: {
  tabs: readonly { value: string; label: string }[];
  value: string;
}) {
  return (
    <div inert className="contents">
      <Tabs className="px-rui-5 h-12 shrink-0 items-stretch" tabs={[...tabs]} value={value} />
    </div>
  );
}

/** A labelled input's placeholder — the label's line box over the control. */
/**
 * One field slot: a single 48px block, because that is literally what a real
 * field is here — the label lives INSIDE the input box, so there is no
 * label-above-control stack to mimic. The earlier label-bar + 36px-bar version
 * measured 50px, and that 2px overshoot compounded once per field row (+4px by
 * `Bill details`, +8px by `Purchase order`, +10px by `Line items`) — a drift
 * that only showed up under measurement, never by eye.
 */
function SkeletonField({ className }: { className?: string }) {
  return <Skeleton className={cn('h-12 w-full', className)} />;
}
