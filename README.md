# AI Tools

[![CI](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/deploy-pages.yml)

واجهة PWA عربية تجمع أدوات ذكاء اصطناعي صغيرة ومستقلة. أول موديول هو **AI Quiz**: يحول أي هدف تعلّم إلى مستويات، يولد أسئلة مناسبة، ويحفظ التقدم للاستكمال لاحقاً.

## Stack

- Vite + React
- Tailwind CSS
- Supabase Auth, PostgreSQL and Edge Functions
- Groq `openai/gpt-oss-120b` with strict structured outputs
- React Markdown + Mermaid
- Vitest + GitHub Actions

## Local development

```bash
npm install
npm run dev
```

انسخ `.env.example` إلى `.env.local` إذا أردت استعمال مشروع Supabase مختلفاً.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

## Architecture

كل أداة داخل `src/modules` مستقلة. تستعمل الموديولات الخدمات المشتركة في `src/core` وعناصر التصميم في `src/shared`، ولا تستورد من موديولات أخرى. الاتصال بـGroq يمر حصراً عبر Supabase Edge Function، ولا يوجد أي مفتاح سري في الواجهة.

## Deployment

النشر المؤقت يتم مباشرة من `main/docs` بدون تشغيل تلقائي لـGitHub Actions. يمكن تشغيل CI وDeploy يدوياً بعد حل قفل الفوترة في الحساب.

التطبيق: [abdellahelhilaly.github.io/ai-tools](https://abdellahelhilaly.github.io/ai-tools/)
