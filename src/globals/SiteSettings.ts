import type { GlobalConfig } from 'payload'

import { hasRole, trustredRoles, userHasRole } from '@/access/hasRole'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
    update: hasRole(trustredRoles.settings),
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Freiwillige Feuerwehr Musterstadt',
    },
    {
      name: 'departmentName',
      type: 'text',
      required: true,
      defaultValue: 'Musterstadt',
    },
    {
      name: 'taglinePrimary',
      type: 'text',
      defaultValue: 'Retten. Löschen. Bergen. Schützen.',
    },
    {
      name: 'taglineSecondary',
      type: 'text',
      defaultValue: 'Ehrenamtlich im Einsatz - verlässlich für alle.',
    },
    {
      name: 'announcement',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Hinweis',
        },
        {
          name: 'message',
          type: 'text',
          defaultValue:
            'Heute 19:30 Uhr Übungsdienst. Treffpunkt Feuerwehrhaus Musterstadt. Interessierte sind als Gäste willkommen.',
        },
      ],
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'brandColor',
          type: 'text',
          defaultValue: '#871d33',
        },
        {
          name: 'brandColorStrong',
          type: 'text',
          defaultValue: '#6d1729',
        },
        {
          name: 'surfaceColor',
          type: 'text',
          defaultValue: '#f7f7f4',
        },
      ],
    },
    {
      name: 'joinButton',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Mitmachen',
        },
        {
          name: 'href',
          type: 'text',
          defaultValue: '/mitmachen',
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'text',
          defaultValue: 'info@ffw-musterstadt.de',
        },
        {
          name: 'emergencyNumber',
          type: 'text',
          defaultValue: '112',
        },
        {
          name: 'address',
          type: 'textarea',
          defaultValue: 'Musterweg 1\n00000 Musterstadt',
        },
      ],
    },
    {
      name: 'legal',
      type: 'group',
      fields: [
        {
          name: 'organizationName',
          type: 'text',
          defaultValue: 'Freiwillige Feuerwehr Musterstadt',
        },
        {
          name: 'responsiblePerson',
          type: 'text',
        },
        {
          name: 'imprintText',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'smtp',
      access: {
        read: ({ req }) => userHasRole(req.user, trustredRoles.settings),
        update: ({ req }) => userHasRole(req.user, trustredRoles.settings),
      },
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'host',
          type: 'text',
        },
        {
          name: 'port',
          type: 'number',
          defaultValue: 587,
        },
        {
          name: 'secure',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'username',
          type: 'text',
        },
        {
          name: 'password',
          type: 'text',
        },
        {
          name: 'fromName',
          type: 'text',
        },
        {
          name: 'fromEmail',
          type: 'text',
        },
        {
          name: 'ignoreTLS',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'requireTLS',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'skipVerify',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
