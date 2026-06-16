import mongoose, { Schema } from 'mongoose';

const heroBlockSchema = new Schema(
    {
        id: { type: String, required: true },
        image: { type: String, required: true, default: '/hero-bg.jpg' },
        title: { type: String, required: true, default: '' },
        subtitle: { type: String, required: true, default: '' },
    },
    { _id: false }
);

const hotlineSchema = new Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true, default: '' },
        number: { type: String, required: true, default: '' },
    },
    { _id: false }
);

const companySchema = new Schema(
    {
        logo: { type: String, required: true, default: '/logo.png' },
        navLogo: { type: String, required: false, default: '' },
        logoStyle: {
            type: Schema.Types.Mixed,
            required: false,
            default: null,
        },
        navLogoStyle: {
            type: Schema.Types.Mixed,
            required: false,
            default: null,
        },
        name: { type: String, required: true, default: 'Forco Travel & Event' },
        shortName: { type: String, required: true, default: 'FORCO' },
        hq: {
            type: String,
            required: true,
            default: 'Trụ sở: 33 Phạm Ngũ Lão, Cửa Nam, Hà Nội',
        },
        office: {
            type: String,
            required: true,
            default: 'VPGD: 03 Trần Khánh Dư, Cửa Nam, Hà Nội',
        },
        websiteLabel: { type: String, required: true, default: 'www.forco.com.vn' },
        websiteUrl: {
            type: String,
            required: true,
            default: 'https://www.forco.com.vn',
        },
        fanpageLabel: {
            type: String,
            required: true,
            default: 'facebook.com/forcotravel',
        },
        fanpageUrl: {
            type: String,
            required: true,
            default: 'https://facebook.com/forcotravel',
        },
        hotlines: { type: [hotlineSchema], required: true, default: [] },
        email: { type: String, required: true, default: 'info@forco.com.vn' },
    },
    { _id: false }
);

const linkItemSchema = new Schema(
    {
        id: { type: String, required: true },
        label: { type: String, required: true, default: '' },
        href: { type: String, required: true, default: '/' },
    },
    { _id: false }
);

const settingsSchema = new Schema(
    {
        _id: { type: String, required: true, default: 'singleton' },
        heroBlocks: { type: [heroBlockSchema], required: true, default: [] },
        company: { type: companySchema, required: true, default: () => ({}) },
        services: { type: [linkItemSchema], required: true, default: [] },
        quickLinks: { type: [linkItemSchema], required: true, default: [] },
        navItems: { type: [linkItemSchema], required: true, default: [] },
    },
    { _id: false, versionKey: false, minimize: false }
);

export const SettingsModel =
    (mongoose.models.Settings as mongoose.Model<unknown>) ||
    mongoose.model('Settings', settingsSchema);

export type SettingsDoc = {
    _id: string;
    heroBlocks: {
        id: string;
        image: string;
        title: string;
        subtitle: string;
    }[];
    company: {
        logo: string;
        navLogo: string;
        logoStyle: {
            mode: 'contained' | 'full' | 'cover';
            width: number;
            height: number;
            radius: number;
            bg: string | null;
            padding: number;
            objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
        };
        navLogoStyle: {
            mode: 'contained' | 'full' | 'cover';
            width: number;
            height: number;
            radius: number;
            bg: string | null;
            padding: number;
            objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
        };
        name: string;
        shortName: string;
        hq: string;
        office: string;
        websiteLabel: string;
        websiteUrl: string;
        fanpageLabel: string;
        fanpageUrl: string;
        hotlines: { id: string; label: string; number: string }[];
        email: string;
    };
    services: { id: string; label: string; href: string }[];
    quickLinks: { id: string; label: string; href: string }[];
    navItems: { id: string; label: string; href: string }[];
};
