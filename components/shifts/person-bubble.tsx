export function PersonBubble({ name }: { name: string }) {
    return (
        <span className="inline-flex max-w-full items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-900 ring-1 ring-sky-200">
            <span className="truncate">{name}</span>
        </span>
    );
}

export function PersonBubbleList({ names }: { names: string[] }) {
    if (!names.length) return null;

    return (
        <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
            {names.map((name) => (
                <PersonBubble key={name} name={name} />
            ))}
        </span>
    );
}
