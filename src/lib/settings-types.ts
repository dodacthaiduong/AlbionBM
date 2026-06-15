export type HeroBlock = {
    id: string;
    image: string;
    title: string;
    subtitle: string;
};

export type Settings = {
    heroBlocks: HeroBlock[];
};
