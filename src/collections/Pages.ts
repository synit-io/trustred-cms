import type { CollectionConfig } from 'payload'

import { hasRole, trustredRoles } from '@/access/hasRole'
import { publishedPageReadAccess } from '@/access/publicReadAccess'
import { isSuperAdmin } from '@/access/isSuperAdmin'
import { BannerBlock } from '@/blocks/BannerBlock'
import { FeedBlock } from '@/blocks/FeedBlock'
import { FormBlock } from '@/blocks/FormBlock'
import { HeroBlock } from '@/blocks/HeroBlock'
import { HtmlBlock } from '@/blocks/HtmlBlock'
import { LinkGridBlock } from '@/blocks/LinkGridBlock'
import { OperationsLogBlock } from '@/blocks/OperationsLogBlock'
import { RichTextBlock } from '@/blocks/RichTextBlock'
import { StatsBlock } from '@/blocks/StatsBlock'
import { TechDetailsBlock } from '@/blocks/TechDetailsBlock'
import { TechOverviewBlock } from '@/blocks/TechOverviewBlock'
import { WarningsBlock } from '@/blocks/WarningsBlock'
import { YouTubeBlock } from '@/blocks/YouTubeBlock'
import { slugField } from '@/fields/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    create: hasRole(trustredRoles.content),
    delete: isSuperAdmin,
    read: publishedPageReadAccess,
    update: hasRole(trustredRoles.content),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'navigationLabel',
      type: 'text',
    },
    {
      name: 'showInNavigation',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'navigationOrder',
      type: 'number',
      defaultValue: 100,
      min: 1,
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        HeroBlock,
        StatsBlock,
        RichTextBlock,
        LinkGridBlock,
        FeedBlock,
        WarningsBlock,
        BannerBlock,
        FormBlock,
        TechOverviewBlock,
        TechDetailsBlock,
        OperationsLogBlock,
        YouTubeBlock,
        HtmlBlock,
      ],
      required: true,
    },
  ],
  versions: {
    drafts: {
      autosave: true,
    },
  },
}
