const block = "animate-pulse rounded-lg bg-border-soft/70 motion-reduce:animate-none";

/** Prospectos while its data loads, with the real shape: «Tu día», the four cards, search, stage and the list. */
export function ProspectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4" aria-busy="true" aria-label="Cargando prospectos">
      <div className="flex items-center justify-between gap-2">
        <span className={`${block} h-8 w-40`} />
        <div className="flex gap-2">
          <span className={`${block} h-11 w-11 rounded-lg md:w-24`} />
          <span className={`${block} h-11 w-11 rounded-lg md:w-44`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-3">
          <div className="grid gap-2.5 rounded-2xl border border-border bg-surface p-3.5">
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2.5">
              <span className={`${block} h-11 w-11 rounded-full`} />
              <span className="grid gap-1.5"><span className={`${block} h-4 w-20 rounded-full`} /><span className={`${block} h-3 w-32`} /></span>
            </div>
            <span className={`${block} h-3 w-11/12`} />
            <span className={`${block} h-3 w-4/5`} />
            <div className="grid grid-cols-2 gap-2"><span className={`${block} h-11`} /><span className={`${block} h-11`} /></div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-3.5">
            <div className="flex justify-between"><span className={`${block} h-3 w-14`} /><span className={`${block} h-3 w-24`} /></div>
            <span className={`${block} h-8 w-48`} />
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((key) => <span key={key} className={`${block} h-16 rounded-xl`} />)}
            </div>
            <span className={`${block} h-1.5 rounded-full`} />
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {[0, 1, 2, 3].map((key) => <span key={key} className={`${block} h-24 rounded-2xl`} />)}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"><span className={`${block} h-11 rounded-xl`} /><span className={`${block} h-11 w-24 rounded-xl`} /></div>
          <span className={`${block} h-11 rounded-xl lg:w-64`} />
          <div className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex h-14 items-center gap-2.5 px-3.5"><span className={`${block} h-2 w-2 rounded-full`} /><span className={`${block} h-3 w-28`} /></div>
            {[0, 1, 2, 3, 4].map((key) => (
              <div key={key} className="grid min-h-16 grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-3 px-3 py-2.5">
                <span className={`${block} h-10 w-10 rounded-xl`} />
                <span className="grid gap-1.5"><span className={`${block} h-3.5 w-4/5`} /><span className={`${block} h-3 w-3/5`} /></span>
                <span className={`${block} h-3`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
