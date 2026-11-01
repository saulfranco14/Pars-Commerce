const block = "animate-pulse rounded-lg bg-border-soft/70 motion-reduce:animate-none";

/** The lead page while it loads, with its real shape: back and actions, name and stepper, «Ahora», summary and history. */
export function LeadDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4" aria-busy="true" aria-label="Cargando prospecto">
      <div className="flex items-center justify-between">
        <span className={`${block} h-5 w-28`} />
        <span className={`${block} h-11 w-11`} />
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-2 md:flex-1">
          <span className={`${block} h-7 w-3/4 max-w-md`} />
          <span className={`${block} h-4 w-1/2 max-w-xs`} />
          <span className={`${block} h-2 w-full max-w-lg rounded-full`} />
        </div>
        <div className="flex gap-2"><span className={`${block} h-11 flex-1 md:w-28`} /><span className={`${block} h-11 flex-1 md:w-32`} /></div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 lg:order-2">
          <span className={`${block} h-4 w-24 rounded-full`} />
          <span className={`${block} h-5 w-2/3`} />
          <span className={`${block} h-3 w-11/12`} />
          <span className={`${block} h-24 rounded-xl`} />
          <span className={`${block} h-11`} />
        </div>
        <div className="grid gap-5 lg:order-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((key) => <span key={key} className={`${block} h-20 rounded-2xl`} />)}
          </div>
          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4">
            {[0, 1, 2].map((key) => (
              <div key={key} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
                <span className={`${block} h-5 w-5 rounded-full`} />
                <span className="grid gap-1.5"><span className={`${block} h-3 w-1/3`} /><span className={`${block} h-12 rounded-xl`} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
