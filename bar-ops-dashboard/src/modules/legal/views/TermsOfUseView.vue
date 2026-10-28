<template>
  <VThemeProvider theme="dark">
    <div class="legal-page" dir="rtl">
      <!-- Background Ambient Glows -->
      <div class="legal-glow legal-glow-top" aria-hidden="true" />
      <div class="legal-glow legal-glow-bottom" aria-hidden="true" />

      <!-- Global Floating Glass Navbar -->
      <LandingNav />

      <main class="legal-main" id="main-content" tabindex="-1">
        <div class="legal-container">
          <article class="legal-card">
            <header class="legal-header">
              <div class="legal-badge-wrap">
                <span class="legal-tag" dir="ltr">KICK · TERMS OF SERVICE</span>
              </div>
              <h1 class="legal-title">תנאי שימוש ותקנון האתר</h1>
              <p class="legal-date">עודכן לאחרונה: {{ lastUpdated }}</p>
              <p class="legal-lead">
                ברוכים הבאים לאתר ולמערכת של <strong>KICK שירותי בר</strong> ("KICK", "החברה", "אנו").
                השימוש באתר (בכתובת kicks.ltd), במערכת הניהול הדיגיטלית ובשירותי ההתקשרות של החברה, כפוף
                לתנאים המפורטים להלן. גלישה באתר, הגשת מועמדות לעבודה או השארת פרטים לקבלת הצעת מחיר, מהווים
                את הסכמתך המלאה לתנאים אלו.
              </p>
            </header>

            <nav class="legal-toc" aria-label="תוכן עניינים">
              <span class="legal-toc-title">תוכן עניינים מהיר</span>
              <ol class="legal-toc-list">
                <li v-for="section in sections" :key="section.id">
                  <a :href="`#${section.id}`">{{ section.title }}</a>
                </li>
              </ol>
            </nav>

            <div class="legal-body">
              <section id="intro" class="legal-section">
                <h2 class="legal-section-title">1. מבוא והסכמה לתנאים</h2>
                <p>
                  תנאי שימוש אלה מהווים הסכם משפטי מחייב בין המשתמש באתר או במערכת לבין חברת KICK שירותי בר
                  בע"מ. השימוש באתר ובשירותים המוצעים בו מותנה בהסכמתך ללא סייג לכל הוראות תקנון זה וכן
                  ל<RouterLink to="/privacy-policy" class="legal-inline-link">מדיניות הפרטיות</RouterLink>
                  שלנו. אם אינך מסכים/ה לתנאי כלשהו מתנאים אלה, הנך מתבקש/ת לחדול מכל שימוש נוסף באתר.
                </p>
              </section>

              <section id="eligibility" class="legal-section">
                <h2 class="legal-section-title">2. כשירות המשתמש</h2>
                <p>
                  השימוש באתר, לרבות הגשת מועמדות לעבודה והשארת פניות לאירועים, מיועד לבגירים מגיל 18 ומעלה
                  בעלי כשרות משפטית תקפה בלבד. במסירת פרטים במערכת, הנך מצהיר/ה ומתחייב/ת כי הינך מעל גיל 18
                  וכי כל הפרטים הנמסרים על ידך הינם נכונים, מדויקים ומלאים.
                </p>
              </section>

              <section id="acceptable-use" class="legal-section">
                <h2 class="legal-section-title">3. איסור שימוש לרעה ואבטחה</h2>
                <p>בעת השימוש באתר ובמערכת, חל איסור מוחלט על:</p>
                <ul class="legal-list">
                  <li>סריקה אוטומטית, איסוף נתונים (Scraping), הפעלת בוטים או כל כלי שליפה אוטומטי אחר.</li>
                  <li>ניסיונות לפגוע באבטחת האתר, עקיפת מנגנוני הצפנה, התחברות ללא הרשאה או גרימת עומס חריג לשרתים.</li>
                  <li>הזנת פרטים כוזבים, לרבות שימוש בפרטי קשר, כתובות דוא"ל או מספרי תעודת זהות של אדם אחר.</li>
                  <li>העלאת קבצים מזיקים, תוכנות זדוניות, סקריפטים פוגעניים או תוכן בלתי חוקי.</li>
                </ul>
                <p>
                  KICK שומרת לעצמה את הזכות לחסום באופן מיידי גישה של כל משתמש שיפר הוראות אלו ולנקוט בכל הצעדים
                  המשפטיים העומדים לרשותה.
                </p>
              </section>

              <section id="inquiries-quotes" class="legal-section">
                <h2 class="legal-section-title">4. פניות, הצעות מחיר והתקשרות</h2>
                <p>
                  השארת פרטים בטופס הלידים או קבלת הערכת מחיר ראשונית אינם מהווים קיבול, אישור הזמנה או הסכם מחייב
                  לביצוע אירוע. הסכם התקשרות תקף ומחייב לשירותי בר מתגבש אך ורק עם חתימת שני הצדדים על הסכם הזמנת
                  אירוע מסודר ונספח מפרט, וכן תשלום מקדמת שמירת מועד בהתאם לתנאי ההסכם.
                </p>
              </section>

              <section id="ip" class="legal-section">
                <h2 class="legal-section-title">5. קניין רוחני</h2>
                <p>
                  כל זכויות הקניין הרוחני באתר ובמערכת — לרבות השם KICK, סמלילים (Logos), עיצובים גרפיים, תצלומים,
                  סרטוני וידאו, קוד המקור, מבנה מסדי הנתונים, תהליכי העבודה ומודלי ניהול המשמרות והטיפים — הינן
                  רכושה הבלעדי של KICK או של צדדים שלישיים שהעניקו לחברה רישיון כדין. אין להעתיק, לשכפל, להפיץ,
                  לפרסם או לעשות כל שימוש מסחרי בתכנים אלה ללא קבלת אישור מפורש מראש ובכתב מאת KICK.
                </p>
              </section>

              <section id="liability" class="legal-section">
                <h2 class="legal-section-title">6. הגבלת אחריות</h2>
                <p>
                  האתר והשירותים הדיגיטליים ניתנים לשימוש "כמות שהם" (AS-IS) ועל בסיס זמינותם (AS-AVAILABLE). החברה
                  עושה מאמצים רבים להבטיח את פעילותם התקינה והרציפה, אך אינה מתחייבת כי השירות לא יופרע, יינתן כסדרו
                  ללא הפסקות, תקלות או טעויות.
                </p>
                <p>
                  החברה לא תישא באחריות לנזקים עקיפים, תוצאתיים או מיוחדים שייגרמו עקב שימוש באתר, הסתמכות על תכנים
                  בו, או תקלות בספקי תשתית ותקשורת צד שלישי (לרבות ספקי ענן AWS או Meta Platforms).
                </p>
              </section>

              <section id="external-links" class="legal-section">
                <h2 class="legal-section-title">7. קישורים לאתרים חיצוניים</h2>
                <p>
                  האתר עשוי לכלול קישורים לעמודים חיצוניים (כגון חשבון האינסטגרם של המותג או קישור וואטסאפ). קישורים
                  אלה נועדו לנוחות המשתמש בלבד, והחברה אינה נושאת באחריות לתכנים, למדיניות הפרטיות או לפעילותם של
                  אתרים אלה.
                </p>
              </section>

              <section id="modifications" class="legal-section">
                <h2 class="legal-section-title">8. שינויים בתנאים</h2>
                <p>
                  KICK רשאית לשנות ולעדכן תנאי שימוש אלה מעת לעת, בהתאם לשיקול דעתה הבלעדי ולדרישות הדין. הנוסח המעודכן
                  יפורסם בעמוד זה בצירוף תאריך העדכון האחרון. המשך השימוש באתר לאחר פרסום התנאים המעודכנים יהווה
                  הסכמה להם.
                </p>
              </section>

              <section id="jurisdiction" class="legal-section">
                <h2 class="legal-section-title">9. ברירת דין וסמכות שיפוט</h2>
                <p>
                  על תנאי שימוש אלה ועל כל עניין הנובע מהשימוש באתר יחולו אך ורק דיני מדינת ישראל. סמכות השיפוט
                  הבלעדית והייחודית בכל מחלוקת הנוגעת לתנאים אלו תהא נתונה לבתי המשפט המוסמכים במחוז תל אביב-יפו.
                </p>
              </section>

              <section id="contact" class="legal-section">
                <h2 class="legal-section-title">10. יצירת קשר</h2>
                <p>
                  בכל שאלה, פנייה או בירור לגבי תנאי השימוש, ניתן לפנות אלינו באמצעות דואר אלקטרוני:
                </p>
                <p class="legal-contact-mail">
                  <a :href="`mailto:${contactEmail}`" class="legal-inline-link">{{ contactEmail }}</a>
                </p>
              </section>
            </div>
          </article>
        </div>
      </main>

      <!-- Global Public Footer -->
      <AppFooter />
    </div>
  </VThemeProvider>
</template>

<script setup lang="ts">
import { VThemeProvider } from 'vuetify/components'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'

const lastUpdated = '6 בספטמבר 2026'
const contactEmail = 'kickbarops@gmail.com'

const sections = [
  { id: 'intro', title: '1. מבוא והסכמה לתנאים' },
  { id: 'eligibility', title: '2. כשירות המשתמש' },
  { id: 'acceptable-use', title: '3. איסור שימוש לרעה' },
  { id: 'inquiries-quotes', title: '4. פניות והצעות מחיר' },
  { id: 'ip', title: '5. קניין רוחני' },
  { id: 'liability', title: '6. הגבלת אחריות' },
  { id: 'external-links', title: '7. קישורים חיצוניים' },
  { id: 'modifications', title: '8. שינויים בתנאים' },
  { id: 'jurisdiction', title: '9. דין וסמכות שיפוט' },
  { id: 'contact', title: '10. יצירת קשר' },
]
</script>

<style scoped>
.legal-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #090a0f;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
}

/* Ambient Glows */
.legal-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(130px);
  z-index: 0;
}

.legal-glow-top {
  top: -80px;
  right: 15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
}

.legal-glow-bottom {
  bottom: 15%;
  left: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
}

.legal-main {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: clamp(96px, 14vh, 130px) clamp(16px, 4vw, 32px) clamp(48px, 8vh, 80px);
}

.legal-container {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
}

.legal-card {
  background: rgba(17, 20, 32, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: clamp(28px, 5vw, 48px);
}

.legal-badge-wrap {
  margin-bottom: 12px;
}

.legal-tag {
  font-family: 'Anton', 'Oswald', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 4px 14px;
  border-radius: 999px;
  display: inline-block;
}

.legal-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-weight: 900;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0 0 8px;
}

.legal-date {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 20px;
}

.legal-lead {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin: 0 0 28px;
}

/* TOC */
.legal-toc {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 36px;
}

.legal-toc-title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #10b981;
  display: block;
  margin-bottom: 12px;
}

.legal-toc-list {
  columns: 2;
  margin: 0;
  padding-inline-start: 20px;
  gap: 20px;
}

.legal-toc-list li {
  break-inside: avoid;
  margin-bottom: 8px;
}

.legal-toc-list a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.84rem;
  transition: all 0.2s ease;
}

.legal-toc-list a:hover {
  color: #10b981;
  text-decoration: underline;
}

/* Body & Sections */
.legal-body {
  display: flex;
  flex-direction: column;
}

.legal-section {
  scroll-margin-top: 100px;
  padding-block: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.legal-section:last-child {
  border-bottom: none;
}

.legal-section-title {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 12px;
}

.legal-section p {
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 10px;
}

.legal-section p:last-child {
  margin-bottom: 0;
}

.legal-inline-link {
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.legal-inline-link:hover {
  color: #34d399;
  text-decoration: underline;
}

.legal-list {
  margin: 10px 0 14px;
  padding-inline-start: 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.9rem;
  line-height: 1.6;
}

.legal-contact-mail {
  font-size: 1rem !important;
  margin-top: 8px !important;
}

@media (max-width: 600px) {
  .legal-toc-list {
    columns: 1;
  }
}
</style>
