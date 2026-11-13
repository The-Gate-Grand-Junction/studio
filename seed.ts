// Seed script — pre-populate a NEW, EMPTY dataset with starter content.
// Run: pnpm exec sanity exec seed.ts --with-user-token
//
// It refuses to touch a dataset that already has content. Once real content
// exists, Studio is the source of truth: this file is not kept in step with it.
// To seed anyway (e.g. a scratch dataset): SEED_FORCE=1 pnpm exec sanity exec seed.ts --with-user-token
// (an environment variable: sanity exec doesn't reliably pass arguments to the script)
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const documents: Array<{ _id: string; _type: string; [field: string]: unknown }> = [
  {
    "_type": "siteSettings",
    "_id": "siteSettings",
    "siteName": "The Gate: A Meeting Venue",
    "ctaLabel": "Get Started",
    "ctaUrl": "/contact",
    "contactEmail": "info@thegategj.com",
    "contactPhone": "",
    "contactAddress": "2825 North Ave, Grand Junction, CO 81501",
    "copyrightText": "© 2026 The Gate: A Meeting Venue. All rights reserved."
  },
  {
    "_type": "page",
    "_id": "page-home",
    "title": "Home",
    "slug": {
      "_type": "slug",
      "current": "/"
    },
    "seoDescription": "The Gate is a meeting venue for worship, connection, and life-changing encounters. Explore a welcoming space for ministries, leaders, and community gatherings.",
    "sections": [
      {
        "_type": "heroSection",
        "_key": "heroSection-0",
        "title": "The Gate: A Meeting Venue",
        "subtitle": ""
      },
      {
        "_type": "featureGrid",
        "_key": "featureGrid-1"
      },
      {
        "_type": "textContent",
        "_key": "textContent-2"
      }
    ]
  },
  {
    "_type": "page",
    "_id": "page-about",
    "title": "About",
    "slug": {
      "_type": "slug",
      "current": "/about"
    },
    "seoDescription": "Learn about The Gate, a professional meeting venue built for worship, connection, collaboration, and leadership development. Meet the vision behind the space.",
    "sections": [
      {
        "_type": "heroSection",
        "_key": "heroSection-0"
      },
      {
        "_type": "textContent",
        "_key": "textContent-1"
      },
      {
        "_type": "teamSection",
        "_key": "teamSection-2"
      },
      {
        "_type": "testimonialsSection",
        "_key": "testimonialsSection-3"
      }
    ]
  },
  {
    "_type": "page",
    "_id": "page-contact",
    "title": "Contact",
    "slug": {
      "_type": "slug",
      "current": "/contact"
    },
    "seoDescription": "Contact The Gate to ask about availability and plan your next meeting, worship gathering, or event. We'd love to help you find the right space for your people.",
    "sections": [
      {
        "_type": "contactSection",
        "_key": "contactSection-0",
        "email": "info@thegategj.com",
        "address": "2825 North Ave, Grand Junction, CO 81501"
      },
      {
        "_type": "mapSection",
        "_key": "mapSection-1"
      }
    ]
  },
  {
    "_type": "page",
    "_id": "page-donate",
    "title": "Donate",
    "slug": {
      "_type": "slug",
      "current": "/donate"
    },
    "seoDescription": "Support The Gate and help keep our doors open for worship, connection, and life-changing encounters. Your gift sustains a welcoming space for the community.",
    "sections": [
      {
        "_type": "donationSection",
        "_key": "donationSection-0"
      }
    ]
  },
  {
    "_type": "legalPage",
    "_id": "legal-privacy-policy",
    "title": "Privacy Policy",
    "slug": {
      "_type": "slug",
      "current": "/privacy-policy"
    }
  },
  {
    "_type": "legalPage",
    "_id": "legal-terms-and-conditions",
    "title": "Terms & Conditions",
    "slug": {
      "_type": "slug",
      "current": "/terms-and-conditions"
    }
  },
  {
    "_type": "legalPage",
    "_id": "legal-accessibility",
    "title": "Accessibility Statement",
    "slug": {
      "_type": "slug",
      "current": "/accessibility"
    }
  },
  {
    "_type": "navigation",
    "_id": "nav-main",
    "navType": "main",
    "items": [
      {
        "_type": "menuLink",
        "_key": "home",
        "label": "Home",
        "url": "/"
      },
      {
        "_type": "menuLink",
        "_key": "about",
        "label": "About",
        "url": "/about"
      },
      {
        "_type": "menuLink",
        "_key": "contact",
        "label": "Contact",
        "url": "/contact"
      },
      {
        "_type": "menuLink",
        "_key": "donate",
        "label": "Donate",
        "url": "/donate"
      }
    ]
  },
  {
    "_type": "navigation",
    "_id": "nav-legal",
    "navType": "legal",
    "items": [
      {
        "_type": "menuLink",
        "_key": "privacy-policy",
        "label": "Privacy Policy",
        "url": "/privacy-policy"
      },
      {
        "_type": "menuLink",
        "_key": "terms-and-conditions",
        "label": "Terms & Conditions",
        "url": "/terms-and-conditions"
      },
      {
        "_type": "menuLink",
        "_key": "accessibility",
        "label": "Accessibility Statement",
        "url": "/accessibility"
      }
    ]
  }
]

// Brand-kit logos saved by the scaffolder, uploaded as Sanity image assets
const logos: Array<{ field: string; file: string }> = [{"field":"logo","file":"seed-assets/logo.png"}]

async function confirmForce(dataset: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`Type the dataset name (${dataset}) to seed it anyway: `)
  rl.close()
  return answer.trim() === dataset
}

async function seed() {
  const dataset = client.config().dataset ?? ''
  const existing: number = await client.fetch(
    'count(*[!(_id in path("_.**")) && !(_type match "system.*") && !(_type match "sanity.*")])',
  )
  if (existing > 0) {
    if (process.env.SEED_FORCE !== '1' && !process.argv.includes('--force')) {
      console.error(`Dataset "${dataset}" already has ${existing} document(s). Not seeding.`)
      console.error('Seeding is for a new, empty dataset. Set SEED_FORCE=1 to override.')
      process.exit(1)
    }
    if (!(await confirmForce(dataset))) {
      console.error('Not confirmed. Nothing written.')
      process.exit(1)
    }
  }

  console.log(`Seeding ${documents.length} document(s)...`)
  const transaction = client.transaction()
  for (const doc of documents) {
    transaction.createIfNotExists(doc)
  }
  await transaction.commit()

  for (const { field, file } of logos) {
    const asset = await client.assets.upload('image', readFileSync(file), { filename: basename(file) })
    await client
      .patch('siteSettings')
      .setIfMissing({ [field]: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()
    console.log(`Uploaded ${file} as siteSettings.${field}`)
  }
  console.log('Seed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
