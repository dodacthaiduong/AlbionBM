export type HeroBlock = {
    id: string;
    image: string;
    title: string;
    subtitle: string;
};

export type Hotline = {
    id: string;
    label: string;
    number: string;
};

export type LogoMode = 'contained' | 'full' | 'cover';
export type LogoObjectFit =
    | 'contain'
    | 'cover'
    | 'fill'
    | 'none'
    | 'scale-down';

export type LogoStyle = {
    mode: LogoMode;
    width: number;
    height: number;
    radius: number;
    bg: string | null;
    padding: number;
    objectFit: LogoObjectFit;
};

export type Company = {
    logo: string;
    navLogo: string;
    logoStyle: LogoStyle;
    navLogoStyle: LogoStyle;
    name: string;
    shortName: string;
    hq: string;
    office: string;
    websiteLabel: string;
    websiteUrl: string;
    fanpageLabel: string;
    fanpageUrl: string;
    hotlines: Hotline[];
    email: string;
};

export type LinkItem = {
    id: string;
    label: string;
    href: string;
};

export type Settings = {
    heroBlocks: HeroBlock[];
    company: Company;
    services: LinkItem[];
    quickLinks: LinkItem[];
    navItems: LinkItem[];
};
