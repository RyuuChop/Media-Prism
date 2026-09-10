export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#04050c]" />
      <div className="bg-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,black_30%,transparent_78%)]" />
      <div className="animate-float-slow absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-indigo-600/25 blur-[130px]" />
      <div className="animate-float-slower absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/20 blur-[130px]" />
      <div className="animate-float-slow absolute -bottom-48 left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-500/15 blur-[130px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(2,4,12,0.75))]" />
    </div>
  );
}
