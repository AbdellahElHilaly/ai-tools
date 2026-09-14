# AI Tools

[![CI](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/ci.yml)
[![Deploy GitHub Pages](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/AbdellahElHilaly/ai-tools/actions/workflows/deploy-pages.yml)

واجهة PWA عربية تجمع أدوات ذكاء اصطناعي صغيرة ومستقلة. أول موديول هو **AI Quiz**: يحول أي هدف تعلّم إلى مستويات، يولد أسئلة مناسبة، ويحفظ التقدم للاستكمال لاحقاً.

## Quiz experience

1. سجّل الدخول ثم اكتب هدف التعلّم وحدد هل تريد حفظه في المكتبة.
2. اختر مستوى من المسار المقترح؛ كل بطاقة تعرض حالتها وتقدمها.
3. أجب عن الأسئلة أو ارجع للمستويات بدون ضياع الإجابات.
4. استأنف أي مستوى من المكتبة، مع حالة واضحة للمزامنة المحلية والسحابية.

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

تقدم المستويات يخزن في `progress_by_level` داخل سجل الكويز. هذا مناسب للحجم الصغير المحدود للمسار، ويبقي تحديث الكويز ذرياً بدون استعلامات متكررة. سياسات RLS تقيد كل سجل بصاحبه.

## Server configuration

أضف مفتاح Groq إلى Supabase Edge Function Secrets، ولا تضعه في ملفات Vite أو GitHub Pages:

```text
GROQ_API_KEY=<secret>
```

الدالة تتحقق من الجلسة، الطلب، الحصة اليومية، مهلة Groq وصيغة JSON. إذا فشل المزود بعد حجز الحصة، ترجع الحصة تلقائياً للمستخدم.

## Deployment

النشر يتم مباشرة من `main/docs` بدون تشغيل تلقائي لـGitHub Actions مدفوعة. يمكن تشغيل CI وDeploy يدوياً عند الحاجة.

التطبيق: [abdellahelhilaly.github.io/ai-tools](https://abdellahelhilaly.github.io/ai-tools/)
