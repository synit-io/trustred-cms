import { applyWarningPresetToBlock, findWarningPreset } from '@/lib/trustred/warning-presets'

const defaultDwdPreset = findWarningPreset(undefined, 'dwd-rheinland-pfalz', 'dwd')

function relativeIsoDate(daysFromToday: number, hour = 18, minute = 0) {
  const value = new Date()
  value.setUTCDate(value.getUTCDate() + daysFromToday)
  value.setUTCHours(hour, minute, 0, 0)
  return value.toISOString()
}

function createWarningBlock(overrides: Record<string, unknown> = {}) {
  const baseBlock = {
    blockType: 'warnings' as const,
    eyebrow: 'DWD Live-Lage',
    headline: 'Wetter und Warnungen',
    intro:
      'Einfach konfigurierbare Warnwidgets mit Regions-Presets sind ein zentraler Teil des neuen Systems.',
    ninaPresetKey: '',
    presetKey: 'dwd-rheinland-pfalz',
    provider: 'dwd' as const,
    showWeatherMap: false,
    showWildfireMap: false,
  }

  if (!defaultDwdPreset) {
    return {
      ...baseBlock,
      ...overrides,
    }
  }

  return {
    ...applyWarningPresetToBlock(baseBlock, defaultDwdPreset),
    ...overrides,
  }
}

function createBannerBlock(overrides: Record<string, unknown> = {}) {
  return {
    blockType: 'banner' as const,
    label: 'Mitmachen',
    primaryHref: '/mitmachen',
    primaryLabel: 'Mitmachen',
    secondaryHref: '/kontakt',
    secondaryLabel: 'Kontakt zur Wehr',
    text: 'Lerne die Wehr kennen, stelle Fragen und finde den passenden Einstieg in Ausbildung, Öffentlichkeitsarbeit oder aktiven Dienst.',
    title: 'Technik, Teamarbeit und Einsatzbereitschaft direkt erleben',
    ...overrides,
  }
}

export const defaultSiteSettings = {
  announcement: {
    enabled: true,
    label: 'Hinweis',
    message:
      'Heute 19:30 Uhr Übungsdienst. Treffpunkt Feuerwehrhaus Musterstadt. Interessierte sind als Gäste willkommen.',
  },
  contact: {
    address: 'Musterweg 1\n00000 Musterstadt',
    email: 'info@ffw-musterstadt.de',
    emergencyNumber: '112',
  },
  departmentName: 'Musterstadt',
  joinButton: {
    href: '/mitmachen',
    label: 'Mitmachen',
  },
  legal: {
    imprintText: '',
    organizationName: 'Freiwillige Feuerwehr Musterstadt',
    responsiblePerson: '',
  },
  siteName: 'Freiwillige Feuerwehr Musterstadt',
  smtp: {
    enabled: false,
    fromEmail: 'noreply@example.com',
    fromName: 'Trustred CMS',
    host: '',
    ignoreTLS: false,
    password: '',
    port: 587,
    requireTLS: false,
    secure: false,
    skipVerify: false,
    username: '',
  },
  taglinePrimary: 'Retten. Löschen. Bergen. Schützen.',
  taglineSecondary: 'Ehrenamtlich im Einsatz - verlässlich für alle.',
  theme: {
    brandColor: '#871d33',
    brandColorStrong: '#6d1729',
    surfaceColor: '#f7f7f4',
  },
}

export const defaultHomePage = {
  layout: [
    {
      blockType: 'hero',
      copy: 'Wir stehen für schnelle Hilfe, verlässliche Ausbildung und gelebtes Ehrenamt. Auf dieser Seite findest du aktuelle Informationen, Einsatzberichte, Termine und Möglichkeiten, dich einzubringen.',
      eyebrow: 'Willkommen',
      headline: 'Einsatzbereit für Musterstadt und Umgebung',
      primaryActionHref: '/mitmachen',
      primaryActionLabel: 'Jetzt mitmachen',
      secondaryActionHref: '/kontakt',
      secondaryActionLabel: 'Schnell kontaktieren',
    },
    {
      blockType: 'stats',
      items: [
        { label: 'Aktive', value: '4' },
        { label: 'Jugend', value: '12' },
        { label: 'Einsätze 2025', value: '3' },
        { label: 'Gründung', value: '1894' },
      ],
    },
    createWarningBlock(),
    {
      blockType: 'feed',
      eyebrow: 'Aktuelles',
      headline: 'Neuigkeiten, Hinweise und Einblicke',
      intro:
        'Der neueste Beitrag aus Ausbildung, Einsatzgeschehen und Öffentlichkeitsarbeit. Weitere Beiträge findest du in der Übersicht.',
      limit: 3,
      source: 'posts',
    },
    {
      blockType: 'feed',
      eyebrow: 'Über Uns / Crew',
      headline: 'Team für Einsatz, Ausbildung und Prävention',
      intro:
        'Unsere Einsatzkräfte, Ausbilderinnen und Ausbilder engagieren sich ehrenamtlich. Neben Einsätzen trainieren wir regelmäßig und halten Technik sowie Abläufe einsatzbereit.',
      limit: 4,
      source: 'crew',
    },
    {
      blockType: 'feed',
      eyebrow: 'Übungen & Termine',
      headline: 'Ausbildung, Veranstaltungen und Termine',
      intro:
        'Regelmäßige Übungen sind die Basis unserer Einsatzbereitschaft. Öffentliche Termine sind klar gekennzeichnet.',
      limit: 4,
      source: 'events',
    },
    {
      blockType: 'feed',
      eyebrow: 'Einsatzarchiv',
      headline: 'Öffentliche Einsatzübersicht',
      intro:
        'Transparente Übersicht zu ausgewählten Alarmierungen. Datenschutzkonform und ohne personenbezogene Details.',
      limit: 6,
      source: 'operations',
    },
    {
      blockType: 'feed',
      eyebrow: 'Technik',
      headline: 'Fahrzeuge und Ausstattung',
      intro: 'Überblick über Fahrzeuge, Funkrufnamen und einsatzrelevante Ausstattung.',
      limit: 3,
      source: 'equipment',
    },
    {
      blockType: 'rich-text',
      copy: 'Fragen zu Mitmachen, Terminen oder Zusammenarbeit? Wir melden uns zeitnah zurück. Keine Notrufe per Mail. In Notfällen immer 112.',
      eyebrow: 'Kontakt',
      headline: 'Schneller Draht zur Wehr',
    },
    createBannerBlock(),
    {
      blockType: 'feed',
      eyebrow: 'Häufig gefragt',
      headline: 'FAQ rund um Feuerwehr und Vorsorge',
      intro:
        'Antworten auf die häufigsten Fragen rund um Einsatzdienst, Mitgliedschaft und Sicherheit.',
      limit: 5,
      source: 'faqs',
    },
  ],
  navigationLabel: 'Start',
  navigationOrder: 1,
  showInNavigation: true,
  slug: 'home',
  title: 'Start',
}

export const defaultManagedPages = [
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Berichte aus Ausbildung, Einsatzgeschehen, Jugend und Öffentlichkeitsarbeit. Diese Seite kann vollständig über den visuellen Page Builder angepasst werden.',
        eyebrow: 'Aktuelles',
        headline: 'Neuigkeiten und Einblicke',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt aufnehmen',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Zur Startseite',
      },
      {
        blockType: 'feed',
        eyebrow: 'Beiträge',
        headline: 'Neueste Meldungen',
        intro: 'Der News-Feed zeigt automatisch die zuletzt veröffentlichten Beiträge.',
        limit: 6,
        source: 'posts',
      },
      createBannerBlock({
        label: 'Aktuelles',
        primaryHref: '/kontakt',
        primaryLabel: 'Kontakt aufnehmen',
        secondaryHref: '/termine',
        secondaryLabel: 'Termine ansehen',
        text: 'Zu Berichten, Veranstaltungen oder Zusammenarbeit kannst du direkt Kontakt aufnehmen oder die nächsten öffentlichen Termine ansehen.',
        title: 'Vom Lesen ins Gespräch',
      }),
    ],
    navigationLabel: 'Aktuelles',
    navigationOrder: 2,
    showInNavigation: true,
    slug: 'aktuelles',
    summary: 'Neuigkeiten, Einblicke und Berichte aus der Wehr.',
    title: 'Aktuelles',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Kommende öffentliche Ausbildungs- und Veranstaltungstermine der Wehr in einer klaren, schnell planbaren Übersicht. Vergangene Veranstaltungen liegen bewusst getrennt im Archiv. Diese Seite kann vollständig über den visuellen Page Builder angepasst werden.',
        eyebrow: 'Termine',
        headline: 'Übungen, Aktionen und öffentliche Termine',
        primaryActionHref: '/termine/archiv',
        primaryActionLabel: 'Archiv ansehen',
        secondaryActionHref: '/kontakt',
        secondaryActionLabel: 'Kontakt',
      },
      {
        blockType: 'feed',
        eyebrow: 'Kalender',
        headline: 'Kommende öffentliche Termine',
        intro:
          'Auf der Terminseite werden kommende öffentliche Veranstaltungen, Übungen und Ausbildungsformate priorisiert dargestellt.',
        limit: 6,
        source: 'events',
      },
    ],
    navigationLabel: 'Übungen & Termine',
    navigationOrder: 3,
    showInNavigation: true,
    slug: 'termine',
    summary: 'Öffentliche Termine, Übungen und Aktionen.',
    title: 'Termine',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Vergangene Termine, Aktionen und Veranstaltungen. Diese Archivseite bleibt ebenfalls über den visuellen Page Builder anpassbar.',
        eyebrow: 'Terminarchiv',
        headline: 'Vergangene öffentliche Termine',
        primaryActionHref: '/termine',
        primaryActionLabel: 'Aktuelle Termine',
        secondaryActionHref: '/mitmachen',
        secondaryActionLabel: 'Mitmachen',
      },
      {
        blockType: 'feed',
        eyebrow: 'Archiv',
        headline: 'Termine im Rückblick',
        intro:
          'Nutze diesen Bereich für Rückblicke oder ergänzende Inhalte zum öffentlichen Terminarchiv.',
        limit: 6,
        source: 'events',
      },
    ],
    navigationLabel: 'Terminarchiv',
    navigationOrder: 30,
    showInNavigation: false,
    slug: 'termine-archiv',
    summary: 'Archivierte öffentliche Termine und Rückblicke.',
    title: 'Terminarchiv',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Antworten auf die wichtigsten Fragen rund um Feuerwehr, Mitmachen und Vorsorge. Diese FAQ-Landingpage lässt sich vollständig im visuellen Editor anpassen.',
        eyebrow: 'FAQ',
        headline: 'Häufige Fragen',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/mitmachen',
        secondaryActionLabel: 'Mitmachen',
      },
      {
        blockType: 'feed',
        eyebrow: 'FAQ',
        headline: 'Antworten auf häufige Fragen',
        intro: 'Der FAQ-Feed zeigt automatisch veröffentlichte Antworten aus dem Fragenkatalog.',
        limit: 8,
        source: 'faqs',
      },
      createBannerBlock({
        label: 'Fragen offen',
        primaryHref: '/kontakt',
        primaryLabel: 'Kontakt',
        secondaryHref: '/mitmachen',
        secondaryLabel: 'Mitmachen',
        text: 'Wenn deine Frage nicht in der Übersicht beantwortet wird, helfen wir direkt weiter.',
        title: 'Vom Lesen ins Gespräch',
      }),
    ],
    navigationLabel: 'FAQ',
    navigationOrder: 20,
    showInNavigation: false,
    slug: 'faq',
    summary: 'Häufige Fragen und Antworten rund um die Wehr.',
    title: 'FAQ',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Einblicke in Rollen, Qualifikationen und Schwerpunkte der Mannschaft. Die öffentliche Teamseite ist als Verzeichnis aufgebaut, damit Zuständigkeiten schnell erfassbar bleiben. Diese Teamseite kann vollständig über den visuellen Page Builder angepasst werden.',
        eyebrow: 'Team',
        headline: 'Menschen der Wehr',
        primaryActionHref: '/mitmachen',
        primaryActionLabel: 'Mitmachen',
        secondaryActionHref: '/kontakt',
        secondaryActionLabel: 'Kontakt',
      },
      {
        blockType: 'feed',
        eyebrow: 'Teamverzeichnis',
        headline: 'Profile nach Aufgaben und Rollen',
        intro:
          'Die Teamansicht gruppiert veröffentlichte Profile nach Rollen und macht Zuständigkeiten schnell sichtbar.',
        limit: 6,
        source: 'crew',
      },
      createBannerBlock({
        label: 'Mitmachen',
        primaryHref: '/mitmachen',
        primaryLabel: 'Mitmachen',
        secondaryHref: '/kontakt',
        secondaryLabel: 'Kontakt',
        text: 'Wer unser Team besser kennenlernen möchte, kann unkompliziert den Einstieg in die Wehr finden.',
        title: 'Vom Zuschauen ins Team',
      }),
    ],
    navigationLabel: 'Team',
    navigationOrder: 21,
    showInNavigation: false,
    slug: 'team',
    summary: 'Menschen, Rollen und Qualifikationen der Wehr.',
    title: 'Team',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Die Technikseite ist jetzt selbst eine vollständig editierbare Payload-Seite. Das Übersichtsmodul und ein optionales Technikdetail lassen sich direkt über den visuellen Builder zusammensetzen.',
        eyebrow: 'Technik',
        headline: 'Fahrzeuge und Ausstattung',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Rückfrage stellen',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Zur Startseite',
      },
      {
        blockType: 'tech-overview',
        eyebrow: 'Technikübersicht',
        headline: 'Fahrzeuge und Technikprofile',
        intro:
          'Öffentliche Technikprofile werden automatisch in der bekannten Trustred-Übersicht dargestellt.',
        maxItems: 12,
        showFeaturedProfile: true,
        showStats: true,
      },
      {
        blockType: 'tech-details',
        eyebrow: 'Technikdetail',
        headline: 'Ausgewähltes Fahrzeug im Detail',
        intro:
          'Optional kann ein einzelnes Fahrzeugprofil zusätzlich prominent innerhalb der Technikseite platziert werden.',
        showCompartments: true,
        showHighlights: true,
      },
    ],
    navigationLabel: 'Technik',
    navigationOrder: 5,
    showInNavigation: true,
    slug: 'technik',
    summary: 'Fahrzeuge, Ausstattung und Technikprofile der Wehr.',
    title: 'Technik',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Die öffentliche Einsatzhistorie ist jetzt ebenfalls eine vollständig editierbare Payload-Seite. Das filterbare Einsatzlog steckt als eigener Seitenblock direkt im visuellen Builder.',
        eyebrow: 'Einsatzhistorie',
        headline: 'Öffentliche Einsatzübersicht',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt zur Wehr',
        secondaryActionHref: '/',
        secondaryActionLabel: 'Zur Startseite',
      },
      {
        blockType: 'operations-log',
        eyebrow: 'Einsatzlog',
        headline: 'Freigegebene Einsätze',
        intro:
          'Kompakte Übersicht der zuletzt freigegebenen Einsätze mit optionalen Kennzahlen und Filterung.',
        maxItems: 100,
        showFilters: true,
        showStats: true,
      },
    ],
    navigationLabel: 'Einsatzhistorie',
    navigationOrder: 4,
    showInNavigation: true,
    slug: 'einsaetze',
    summary: 'Öffentliche, datenschutzkonforme Einsatzhistorie.',
    title: 'Einsatzhistorie',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Kompakte Hinweise für Alltag, Veranstaltungen und Notfälle. Diese Sicherheitsseite lässt sich vollständig mit den Trustred-Blöcken pflegen.',
        eyebrow: 'Sicherheit',
        headline: 'Vorsorge, Verhalten und schnelle Orientierung',
        primaryActionHref: '/kontakt',
        primaryActionLabel: 'Kontakt',
        secondaryActionHref: '/faq',
        secondaryActionLabel: 'FAQ',
      },
      createWarningBlock({
        eyebrow: 'Lage',
        headline: 'Warnungen und Lage',
        intro: 'Warnmodule lassen sich einfach über Presets an die gewünschte Region anbinden.',
      }),
      {
        blockType: 'feed',
        eyebrow: 'Antworten',
        headline: 'Passende Antworten direkt verlinkt',
        intro: 'Nutze FAQ-Inhalte als schnell lesbaren Sicherheits- und Vorsorgebereich.',
        limit: 4,
        source: 'faqs',
      },
      createBannerBlock({
        label: 'Sicherheit',
        primaryHref: '/kontakt',
        primaryLabel: 'Kontakt aufnehmen',
        secondaryHref: '/termine',
        secondaryLabel: 'Termine ansehen',
        text: 'Zu Hinweisen, Veranstaltungen oder Zusammenarbeit kannst du direkt Kontakt aufnehmen oder die nächsten öffentlichen Termine ansehen.',
        title: 'Vom Lesen ins Gespräch',
      }),
    ],
    navigationLabel: 'Sicherheit',
    navigationOrder: 6,
    showInNavigation: true,
    slug: 'sicherheit',
    summary: 'Sicherheits-, Vorsorge- und Orientierungshinweise.',
    title: 'Sicherheit',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Allgemeine Anfragen, Presse, Zusammenarbeit oder organisatorische Rückfragen laufen hier gebündelt zusammen.',
        eyebrow: 'Kontakt',
        headline: 'Kontakt zur Wehr',
        primaryActionHref: '/faq',
        primaryActionLabel: 'FAQ ansehen',
        secondaryActionHref: '/mitmachen',
        secondaryActionLabel: 'Mitmachen',
      },
      {
        blockType: 'form',
        eyebrow: 'Kontaktformular',
        formMode: 'preset',
        headline: 'Allgemeine Anfragen',
        intro: 'Nutze das Kontaktformular für allgemeine Rückfragen. In Notfällen gilt immer 112.',
        presetKey: 'contact',
      },
      createBannerBlock({
        label: 'Mitmachen',
        primaryHref: '/mitmachen',
        primaryLabel: 'Mitmachen',
        secondaryHref: '/',
        secondaryLabel: 'Zur Startseite',
        text: 'Lerne die Wehr kennen, stelle Fragen und finde den passenden Einstieg in Ausbildung, Öffentlichkeitsarbeit oder aktiven Dienst.',
        title: 'Der nächste Schritt beginnt mit einer Nachricht',
      }),
    ],
    navigationLabel: 'Kontakt',
    navigationOrder: 7,
    showInNavigation: true,
    slug: 'kontakt',
    summary: 'Kontaktseite mit direkter Formularanbindung.',
    title: 'Kontakt',
  },
  {
    layout: [
      {
        blockType: 'hero',
        copy: 'Teamarbeit, Technik und Verantwortung. Wer Interesse hat, kann unverbindlich Kontakt aufnehmen und die Wehr kennenlernen.',
        eyebrow: 'Mitmachen',
        headline: 'Einstieg ins Ehrenamt',
        primaryActionHref: '/termine',
        primaryActionLabel: 'Termine ansehen',
        secondaryActionHref: '/kontakt',
        secondaryActionLabel: 'Fragen klären',
      },
      {
        blockType: 'feed',
        eyebrow: 'Termine',
        headline: 'Öffentliche Kennenlerntermine',
        intro:
          'Ideal für Interessierte, die die Wehr direkt bei einer Veranstaltung oder einem öffentlichen Termin kennenlernen möchten.',
        limit: 3,
        source: 'events',
      },
      {
        blockType: 'form',
        eyebrow: 'Mitmachen Formular',
        formMode: 'preset',
        headline: 'Interesse senden',
        intro:
          'Direkter Einstieg für unverbindliche Anfragen rund um aktive Mitarbeit, Jugend oder unterstützende Rollen.',
        presetKey: 'join',
      },
      createBannerBlock({
        label: 'Nächste Schritte',
        primaryHref: '/kontakt',
        primaryLabel: 'Direkt Kontakt aufnehmen',
        secondaryHref: '/termine',
        secondaryLabel: 'Öffentliche Termine',
        text: 'Wenn du zuerst persönlich vorbeischauen oder Fragen stellen möchtest, helfen wir dir unkompliziert weiter.',
        title: 'Vom Interesse ins Kennenlernen',
      }),
    ],
    navigationLabel: 'Mitmachen',
    navigationOrder: 8,
    showInNavigation: false,
    slug: 'mitmachen',
    summary: 'Mitmachen- und Recruiting-Seite mit Formularblock.',
    title: 'Mitmachen',
  },
] as const

export const fallbackFeedData = {
  crew: [
    {
      focus: 'Einsatzleitung und Ausbildung',
      name: 'Stefanie Klein',
      qualification: 'Gruppenführerin',
      role: 'Wehrführung',
      skills: [{ label: 'AGT' }, { label: 'Maschinistin' }, { label: 'Ausbilderin' }],
    },
    {
      focus: 'Fahrzeug und Pumpentechnik',
      name: 'Jonas Weber',
      qualification: 'Maschinist',
      role: 'Stv. Wehrführung',
      skills: [{ label: 'Maschinist' }, { label: 'THL' }, { label: 'Gerätewartung' }],
    },
    {
      focus: 'Jugendfeuerwehr und Öffentlichkeitsarbeit',
      name: 'Mara Schneider',
      qualification: 'Jugendwartin',
      role: 'Jugendfeuerwehr',
      skills: [
        { label: 'Jugendarbeit' },
        { label: 'Brandschutzerziehung' },
        { label: 'Social Media' },
      ],
    },
    {
      focus: 'Atemschutz und Einsatzdokumentation',
      name: 'Tobias Becker',
      qualification: 'Atemschutzgeräteträger',
      role: 'Einsatzabteilung',
      skills: [{ label: 'AGT' }, { label: 'Funk' }, { label: 'Dokumentation' }],
    },
  ],
  equipment: [
    {
      callSign: 'Florian Musterstadt 45/1',
      facts: [{ label: 'Typ', value: 'TSF-W' }],
      highlights: [
        {
          description:
            'Kompaktes Erstangriffsfahrzeug für Brandeinsätze und kleinere technische Hilfeleistungen im Ortsgebiet.',
          title: 'Schneller Erstangriff',
        },
        {
          description:
            'Wasser, Pumpe und Grundausstattung sind auf kurze Wege und flexible Einsatzlagen ausgelegt.',
          title: 'Flexible Beladung',
        },
      ],
      compartments: [
        {
          code: 'G1',
          contents: [{ label: 'Schlauchmaterial' }, { label: 'Armaturen' }, { label: 'Verteiler' }],
          description: 'Schnell zugängliche Standardbeladung für Wasserförderung und Erstangriff.',
          title: 'Wasserförderung',
        },
        {
          code: 'G2',
          contents: [
            { label: 'Motorsäge' },
            { label: 'Absperrmaterial' },
            { label: 'Werkzeugkiste' },
          ],
          description: 'Material für Unwetterlagen und einfache technische Hilfeleistungen.',
          title: 'Technische Hilfe',
        },
      ],
      name: 'Tragkraftspritzenfahrzeug mit Wasser (TSF-W)',
      slug: 'tsf-w',
      summary:
        'Das TSF-W ist ein vielseitiges Erstangriffsfahrzeug für das Einsatzgebiet. Es verbindet schnelle Wasserabgabe, flexible Beladung und kompakte Abmessungen.',
    },
    {
      callSign: 'Florian Musterstadt 43/1',
      compartments: [
        {
          code: 'G1',
          contents: [
            { label: 'C-Schläuche' },
            { label: 'Hohlstrahlrohre' },
            { label: 'Schaummittel' },
          ],
          description: 'Material für den schnellen Innen- und Außenangriff.',
          title: 'Brandbekämpfung',
        },
        {
          code: 'G3',
          contents: [{ label: 'Lüfter' }, { label: 'Stromerzeuger' }, { label: 'Beleuchtung' }],
          description: 'Ausstattung für verrauchte Gebäude und nächtliche Einsatzstellen.',
          title: 'Einsatzstellenbetrieb',
        },
      ],
      facts: [
        { label: 'Typ', value: 'LF 10' },
        { label: 'Besatzung', value: '1/8' },
        { label: 'Wasser', value: '1.200 l' },
      ],
      highlights: [
        {
          description:
            'Das Löschgruppenfahrzeug deckt den Standard-Brandeinsatz ab und ergänzt das TSF-W.',
          title: 'Starker Grundschutz',
        },
        {
          description:
            'Durch Atemschutz, Lüfter und Beleuchtung ist das Fahrzeug flexibel für Gebäudelagen einsetzbar.',
          title: 'Vielseitige Einsatzmittel',
        },
      ],
      name: 'Löschgruppenfahrzeug 10 (LF 10)',
      slug: 'lf-10',
      summary:
        'Das LF 10 ist das zentrale Fahrzeug für größere Brandeinsätze und technische Unterstützung. Es bringt Mannschaft, Wasser und umfangreiche Ausrüstung zur Einsatzstelle.',
    },
    {
      callSign: 'Florian Musterstadt 19/1',
      compartments: [
        {
          code: 'Heck',
          contents: [
            { label: 'Absperrmaterial' },
            { label: 'Pavillon' },
            { label: 'Erste-Hilfe-Rucksack' },
          ],
          description:
            'Material für Führungsunterstützung, Jugendfeuerwehr und Öffentlichkeitsarbeit.',
          title: 'Transport und Organisation',
        },
      ],
      facts: [
        { label: 'Typ', value: 'MTW' },
        { label: 'Sitzplätze', value: '9' },
      ],
      highlights: [
        {
          description:
            'Der Mannschaftstransportwagen bringt Einsatzkräfte und Jugendgruppen sicher ans Ziel.',
          title: 'Flexibler Transport',
        },
      ],
      name: 'Mannschaftstransportwagen (MTW)',
      slug: 'mtw',
      summary:
        'Der MTW unterstützt Einsatzlogistik, Ausbildung, Jugendfeuerwehr und Veranstaltungen. Er zeigt, wie auch organisatorische Fahrzeuge im CMS gepflegt werden.',
    },
  ],
  events: [
    {
      endsAt: relativeIsoDate(-18, 20, 30),
      eventType: 'jugend',
      location: 'Feuerwehrhaus',
      startsAt: relativeIsoDate(-18, 18, 0),
      summary: 'Mitmachstationen, Fahrzeugschau und Einblicke in Jugendfeuerwehr und Ausbildung.',
      title: 'Aktionstag für Kinder und Jugendliche',
      visibility: 'public',
    },
    {
      endsAt: relativeIsoDate(10, 21, 0),
      eventType: 'oeffentlich',
      location: 'Mehrzweckhalle Musterstadt',
      startsAt: relativeIsoDate(10, 19, 0),
      summary: 'Kostenfreier Kurzworkshop zu Notruf, Reanimation und Hausapotheke.',
      title: 'Erste Hilfe für Bürger',
      visibility: 'public',
    },
    {
      endsAt: relativeIsoDate(24, 22, 0),
      eventType: 'uebung',
      location: 'Feuerwehrhaus Musterstadt',
      startsAt: relativeIsoDate(24, 19, 30),
      summary:
        'Offener Übungsabend mit kurzer Einführung für Interessierte und anschließender Gerätevorstellung.',
      title: 'Offener Übungsabend mit Technikvorführung',
      visibility: 'public',
    },
    {
      endsAt: relativeIsoDate(45, 16, 0),
      eventType: 'oeffentlich',
      location: 'Feuerwehrhaus Musterstadt',
      registrationEnabled: true,
      startsAt: relativeIsoDate(45, 11, 0),
      summary: 'Fahrzeugschau, Mitmachstationen, Brandschutzerziehung und Kaffee im Gerätehaus.',
      title: 'Tag der offenen Tür am Gerätehaus',
      visibility: 'public',
    },
    {
      endsAt: relativeIsoDate(62, 20, 0),
      eventType: 'ausbildung',
      location: 'Schulungsraum Feuerwehrhaus',
      registrationEnabled: true,
      startsAt: relativeIsoDate(62, 18, 30),
      summary:
        'Kompakte Einweisung in Rauchmelder, Löschdecken, Notruf und Verhalten bei Entstehungsbränden.',
      title: 'Brandschutz im Haushalt',
      visibility: 'public',
    },
    {
      endsAt: relativeIsoDate(90, 21, 30),
      eventType: 'uebung',
      location: 'Bauhof Musterstadt',
      startsAt: relativeIsoDate(90, 19, 0),
      summary:
        'Öffentliche Jahresabschlussübung mit angenommener Unwetterlage und Technikschau im Anschluss.',
      title: 'Jahresabschlussübung am Gerätehaus',
      visibility: 'public',
    },
  ],
  faqs: [
    {
      answer:
        'Der einfachste Weg ist unser Mitmachen-Formular. Danach laden wir dich unverbindlich zu zwei Übungsabenden ein, damit du Team und Ablauf direkt kennenlernst.',
      question: 'Wie kann ich bei der Feuerwehr Musterstadt mitmachen?',
    },
    {
      answer: 'Sofort über 112. Lieber einmal zu früh alarmieren als zu spät.',
      question: 'Wie schnell darf ich die Feuerwehr im Notfall anrufen?',
    },
    {
      answer:
        'Nein. Für den Einstieg reichen Interesse, Teamgeist und regelmäßige Teilnahme. Die nötigen Grundlagen lernst du Schritt für Schritt in Ausbildung und Übung.',
      question: 'Brauche ich Vorerfahrung für den aktiven Dienst?',
    },
    {
      answer:
        'Die Jugendfeuerwehr Musterstadt nimmt Kinder und Jugendliche ab 10 Jahren auf. Die genauen Zeiten findest du bei den Terminen.',
      question: 'Ab welchem Alter ist Jugendfeuerwehr möglich?',
    },
    {
      answer:
        'Öffentliche Termine sind im Kalender sichtbar. Interne Übungen werden nur in der Redaktion gepflegt und nicht öffentlich ausgespielt.',
      question: 'Sind alle Übungsabende öffentlich?',
    },
    {
      answer:
        'Ja. Über das Kontaktformular kannst du Fragen zu Brandschutzerziehung, Veranstaltungen oder Zusammenarbeit stellen. Notfälle bitte immer über 112 melden.',
      question: 'Kann ich die Feuerwehr für eine Veranstaltung kontaktieren?',
    },
  ],
  operations: [
    {
      alarmCode: 'H 1',
      category: 'wetter',
      location: 'Landstraße im Gemeindegebiet',
      operationNumber: 'E-2026-014',
      startedAt: relativeIsoDate(-12, 6, 42),
      summary: 'Baum auf Fahrbahn beseitigt, Verkehrsweg gesichert.',
      unitsInvolved: [{ unit: 'FF Musterstadt: TSF-W' }, { unit: 'Polizei: Streifenwagen' }],
    },
    {
      alarmCode: 'B 1',
      category: 'brand',
      location: 'Wohngebiet Musterstadt',
      operationNumber: 'E-2026-013',
      startedAt: relativeIsoDate(-16, 18, 11),
      summary: 'Kaminbrand kontrolliert, Schornsteinfeger unterstützt, keine Verletzten.',
      unitsInvolved: [{ unit: 'FF Musterstadt: LF 10' }, { unit: 'Schornsteinfeger-Notdienst' }],
    },
    {
      alarmCode: 'H 2',
      category: 'hilfe',
      details:
        'Nach einem Verkehrsunfall wurde die Einsatzstelle abgesichert, auslaufende Betriebsstoffe wurden aufgenommen und der Rettungsdienst unterstützt.',
      isPublic: true,
      location: 'Kreisstraße Richtung Oberdorf',
      operationNumber: 'E-2026-012',
      startedAt: relativeIsoDate(-24, 14, 28),
      summary: 'Verkehrsunfall abgesichert, Rettungsdienst und Polizei unterstützt.',
      unitsInvolved: [
        { unit: 'FF Musterstadt: TSF-W' },
        { unit: 'Rettungsdienst' },
        { unit: 'Polizei' },
      ],
    },
    {
      alarmCode: 'BMA',
      category: 'brand',
      details:
        'Die automatische Brandmeldeanlage wurde kontrolliert. Es handelte sich um angebranntes Essen, die Anlage wurde zurückgestellt.',
      isPublic: true,
      location: 'Seniorenzentrum Musterstadt',
      operationNumber: 'E-2026-011',
      startedAt: relativeIsoDate(-31, 11, 7),
      summary: 'Brandmeldeanlage ausgelöst, keine weitere Tätigkeit erforderlich.',
      unitsInvolved: [{ unit: 'FF Musterstadt: LF 10' }, { unit: 'FF Nachbarort: DLK' }],
    },
    {
      alarmCode: 'S 1',
      category: 'sonstiges',
      details:
        'Absicherung des Laternenumzugs mit Verkehrslenkung, Beleuchtung und Bereitschaft am Feuerwehrhaus.',
      isPublic: true,
      location: 'Ortskern Musterstadt',
      operationNumber: 'E-2026-010',
      startedAt: relativeIsoDate(-48, 17, 45),
      summary: 'Sicherheitswache und Verkehrsabsicherung bei öffentlicher Veranstaltung.',
      unitsInvolved: [{ unit: 'FF Musterstadt: MTW' }],
    },
  ],
  posts: [
    {
      category: 'oeffentlichkeitsarbeit',
      excerpt:
        'Beim letzten Übungsabend stand die technische Hilfeleistung bei Verkehrsunfällen im Mittelpunkt.',
      publishedAt: relativeIsoDate(-7, 18, 0),
      title: 'Erfolgreicher Übungsabend zur Technischen Hilfeleistung',
    },
    {
      category: 'jugend',
      content:
        'Die Jugendfeuerwehr Musterstadt zeigte beim Aktionstag, wie Teamarbeit, Technik und Verantwortung zusammengehören. An mehreren Stationen konnten Kinder Schläuche kuppeln, Funkmeldungen üben und die Fahrzeuge kennenlernen.',
      excerpt:
        'Beim Aktionstag standen Mitmachen, Technik und Brandschutzerziehung im Mittelpunkt.',
      publishedAt: relativeIsoDate(-14, 16, 0),
      title: 'Jugendfeuerwehr zeigt Teamarbeit beim Aktionstag',
    },
    {
      category: 'ausbildung',
      content:
        'Die neue Gerätefachstruktur am TSF-W verkürzt Wege im Erstangriff. Im CMS wird diese Ausstattung mit Fakten, Highlights und einzelnen Geräteräumen sichtbar gemacht.',
      excerpt:
        'Neue Ordnung am TSF-W zeigt, wie Fahrzeugdetails im CMS gepflegt und öffentlich erklärt werden.',
      publishedAt: relativeIsoDate(-21, 10, 0),
      title: 'Neue Gerätefächer machen das TSF-W noch schneller einsatzbereit',
    },
    {
      category: 'einsatz',
      content:
        'Nach Starkregen und Windböen arbeitete die Freiwillige Feuerwehr Musterstadt mehrere Einsatzstellen ab. Im Vordergrund standen Absicherung, Beseitigung von Ästen und Information der Bürgerinnen und Bürger.',
      excerpt: 'Mehrere wetterbedingte Einsatzstellen wurden sicher und strukturiert abgearbeitet.',
      publishedAt: relativeIsoDate(-30, 9, 0),
      title: 'Unwetterlage sicher abgearbeitet',
    },
  ],
}
