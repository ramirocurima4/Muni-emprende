export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando" className="space-y-6">
      <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-white/70" />
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-white/70" />
    </div>
  );
}
