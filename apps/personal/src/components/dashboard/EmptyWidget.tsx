interface Props {
  title: string;
  /** Welke pijplijn deze widget zou moeten vullen. Verplicht: een lege widget zonder oorzaak is ruis. */
  pipeline: string;
  detail?: string;
}

/** Lege staat die benoemt WAAROM er niets staat. Nooit een nul tonen die op een meting lijkt. */
export default function EmptyWidget({ title, pipeline, detail }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-[#E5DFCE] bg-white/40 p-5">
      <p className="text-sm font-medium text-[#15140F]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#7E7A6F]">
        Nog geen data. Deze widget wordt gevuld door <span className="font-medium text-[#4B4842]">{pipeline}</span>.
        {detail ? ` ${detail}` : ""}
      </p>
    </div>
  );
}
