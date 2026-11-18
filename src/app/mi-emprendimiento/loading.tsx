export default function MiEmprendimientoLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-36 animate-pulse rounded-[28px] bg-white/75" />
      <div className="h-96 animate-pulse rounded-[28px] bg-white/75" />
      <div className="h-16 animate-pulse rounded-[26px] bg-brand-green/25" />
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-[26px] bg-white/75" />
        <div className="h-36 animate-pulse rounded-[26px] bg-white/75" />
      </div>
    </div>
  );
}
