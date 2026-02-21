

# Integrating CV and Behance Portfolio

## What we're doing
Replacing the placeholder content across the site with Hans's real CV data and Behance portfolio projects, creating an authentic personal portfolio.

## Changes Overview

### 1. Update About Page with Real CV Content
Replace the placeholder bio with real information from the CVs:
- **Profile**: Use the English CV profile text about being a dynamic E-commerce Manager with 6+ years experience
- **Work Experience Timeline**: Add a visual timeline showing all roles (Alpine Hearing Protection, Webhelp/GGD, IGM Badkamerwinkel, Intergamma)
- **Education**: B.A.Sc. Communication & Media Studies at HU Utrecht (2012-2016), ICT Manager MBO at ROC Hilversum (2007-2011)
- **Core Competencies**: Display skills like Amazon & Bol Marketplaces, SEO/PPC, Project Management, etc. as styled tags
- **Key Achievements**: Highlight metrics like 70% market share, +40% organic traffic, +35% SEO visibility
- **Contact details**: Update email to hansvl3@gmail.com, location to Amersfoort, LinkedIn to linkedin.com/in/hansvl3

### 2. Update Hero Section
- Change subtitle from "UX Designer / E-commerce Expert" to "E-commerce Manager / Marketplace Specialist"
- Update intro text to reflect real expertise in Amazon, Bol.com, and e-commerce platforms
- Update location from Amsterdam to Amersfoort

### 3. Replace Case Studies with Behance Projects
Replace the 6 placeholder case studies in `content.ts` with real Behance projects. Each will link out to the Behance project page:

| Project | Category |
|---------|----------|
| Concept webshop muismatwinkel.nl | E-commerce / UX |
| De zuilenchallenge | Creative / Campaign |
| New pokemon game concept | Game Design |
| Small world | 3D / Creative |
| Infographic Stopbierbelasting | Infographic |
| Ordina VR game | VR / Game Design |
| 3D experiments | 3D Design |
| Cinema 4D experiments | 3D Design |
| Edelman website | Web Design |

We'll use the Behance thumbnail images directly (hosted on Behance CDN) and link each card to the full Behance project.

### 4. Update Footer Links
- LinkedIn: link to linkedin.com/in/hansvl3
- Behance: link to behance.net/jowikroon
- Replace "Dribbble" and "Twitter" with relevant links (Behance, personal site www.BeHans.nl)

### 5. Update Work/Case Study Types
- Add optional `externalUrl` field to the `CaseStudy` type so cards can link to Behance
- Update `CaseStudyCard` to open external links in new tabs

### 6. Store CV PDFs
- Copy both PDF files to `public/` so they can be downloaded from the About page via a "Download CV" button

---

## Technical Details

**Files to modify:**
- `src/data/types.ts` -- add `externalUrl` to CaseStudy
- `src/data/content.ts` -- replace case studies with Behance projects, update profile data
- `src/components/Hero.tsx` -- update title, subtitle, description
- `src/pages/About.tsx` -- full rewrite with real CV data, work experience timeline, skills, education, download CV button
- `src/components/CaseStudyCard.tsx` -- support external links
- `src/components/Footer.tsx` -- update social links
- Copy PDFs to `public/` for download

**New data structure for About page:**
- Work experience entries as a typed array with company, role, dates, highlights
- Skills/competencies as a list
- Education entries with institution, degree, years

