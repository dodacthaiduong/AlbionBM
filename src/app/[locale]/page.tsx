import { setRequestLocale } from 'next-intl/server';
import { getSettings, type HeroBlock } from '@/lib/settings';

export const dynamic = 'force-dynamic';

function HeroSection({ block }: { block: HeroBlock }) {
    return (
        <section
            className="hero-bg relative flex min-h-screen items-center justify-center px-6 py-32"
            style={{ backgroundImage: `url(${block.image})` }}
        >
            <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
            <div className="relative z-10 max-w-2xl text-center">
                <h1
                    className="font-serif text-4xl font-bold text-white sm:text-5xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
                >
                    {block.title}
                </h1>
                {block.subtitle && (
                    <p
                        className="mt-4 text-lg text-white/90"
                        style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                    >
                        {block.subtitle}
                    </p>
                )}
            </div>
        </section>
    );
}

export default async function Home({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const settings = await getSettings();
    const blocks = settings.heroBlocks;
    return (
        <main className="flex flex-col">
            {blocks.map((block) => (
                <HeroSection key={block.id} block={block} />
            ))}
        </main>
    );
}
