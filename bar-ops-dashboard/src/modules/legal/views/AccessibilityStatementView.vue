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
                <span class="legal-tag" dir="ltr">KICK · ACCESSIBILITY</span>
              </div>
              <h1 class="legal-title">הצהרת נגישות</h1>
              <p class="legal-date">עודכן לאחרונה: {{ lastUpdated }}</p>
              <p class="legal-lead">
                <strong>KICK שירותי בר בע"מ</strong> ("אנחנו", "החברה") רואה חשיבות רבה במתן שירות
                שוויוני ונגיש לכלל הציבור, לרבות אנשים עם מוגבלות. אנו פועלים להנגשת האתר והשירותים
                הדיגיטליים שלנו בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998 ולתקנות שוויון
                זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013.
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
              <section id="standard" class="legal-section">
                <h2 class="legal-section-title">1. רמת הנגישות והתקן</h2>
                <p>
                  אנו פועלים להנגשת העמודים הפומביים של האתר לרמה AA בהתאם לתקן הישראלי ת"י 5568
                  ("קווים מנחים לנגישות תכנים באינטרנט"), המבוסס על הנחיות WCAG 2.0 של ארגון W3C.
                  ההנגשה מבוצעת באופן מתמשך, ואנו ממשיכים לשפר את רמת הנגישות מעת לעת.
                </p>
              </section>

              <section id="scope" class="legal-section">
                <h2 class="legal-section-title">2. הדפים שהונגשו</h2>
                <p>הצהרה זו חלה על העמודים הפומביים של האתר, ובכללם:</p>
                <ul class="legal-list">
                  <li>עמוד הבית והקישורים (עבודה איתנו / סגירת אירוע)</li>
                  <li>עמוד השארת פרטים לאירוע</li>
                  <li>עמוד רישום והצטרפות לצוות</li>
                  <li>עמוד עדכון פרטים אישיים לעובדים</li>
                  <li>עמוד רישום למשמרת</li>
                  <li>עמוד מדיניות הפרטיות</li>
                </ul>
              </section>

              <section id="measures" class="legal-section">
                <h2 class="legal-section-title">3. ההתאמות שבוצעו</h2>
                <p>בין ההתאמות שבוצעו באתר:</p>
                <ul class="legal-list">
                  <li>ניווט מלא באמצעות מקלדת וסימון ברור של רכיב הפוקוס הפעיל</li>
                  <li>ניגודיות צבעים בין טקסט לרקע בהתאם לרמה AA</li>
                  <li>טקסט חלופי לתמונות ולוגו, והסתרת רכיבים דקורטיביים מקוראי מסך</li>
                  <li>תוויות (labels) לכל שדות הטופס, והצגת הודעות שגיאה המקושרות לשדה</li>
                  <li>מבנה עמוד סמנטי עם כותרות מדורגות</li>
                  <li>הגדרת שפה (עברית) וכיווניות מימין לשמאל (RTL) לכל העמוד</li>
                  <li>כיבוד העדפת המשתמש להפחתת תנועה (prefers-reduced-motion)</li>
                  <li>עיצוב רספונסיבי המותאם לצפייה במחשב, בטאבלט ובטלפון נייד</li>
                </ul>
              </section>

              <section id="limitations" class="legal-section">
                <h2 class="legal-section-title">4. מגבלות ידועות</h2>
                <p>
                  למרות מאמצינו להנגיש את כלל רכיבי האתר, ייתכן שחלקים מסוימים טרם הונגשו במלואם או
                  יימצאו כלא נגישים בשל מגבלות טכנולוגיות. אנו פועלים לתקן זאת ולהעלות את רמת הנגישות
                  באופן שוטף. בכל מקרה שבו נתקלתם ברכיב שאינו נגיש, נשמח שתפנו אלינו (ראו סעיף 7) ונטפל
                  בפנייה בהקדם.
                </p>
                <p>
                  אזור הניהול הסגור של המערכת, המצריך התחברות והמיועד לצוות העובדים והמנהלים בלבד, אינו
                  חלק מהשירות הפומבי שאליו מתייחסת הצהרה זו.
                </p>
              </section>

              <section id="physical-accessibility" class="legal-section">
                <h2 class="legal-section-title">5. הסדרי נגישות פיזיים</h2>
                <p>
                  חברת KICK מעניקה שירותי בר ניידים לאירועים, הפקות ומתחמים שונים ברחבי הארץ. משרדי החברה ומתחמי הלוגיסטיקה אינם פתוחים לקבלת קהל פרונטלי.
                </p>
                <p>
                  מתן השירות, ייעוץ, הצעות מחיר והתקשרות שוטפת מבוצעים בערוצים דיגיטליים ומרחוק (טלפון, WhatsApp ודוא"ל). ככל שנדרשת פגישה פיזית נגישה, היא תתואם מראש במקום בעל הסדרי נגישות מלאים המותאם לצורכי הלקוח. באירועים בשטח, עמדות הבר מותקנות ומופעלות בתיאום מלא עם מנהלי האירוע ובהתאם לנגישות המקום המארח.
                </p>
              </section>

              <section id="contact" class="legal-section">
                <h2 class="legal-section-title">6. פנייה בנושא נגישות</h2>
                <p>
                  אם נתקלתם בבעית נגישות באתר, או שברצונכם לבקש התאמת נגישות לצורך קבלת שירות, נשמח
                  שתפנו אלינו. כדי שנוכל לטפל בפנייה במהירות, מומלץ לפרט: את מהות הבעיה, את העמוד או
                  הרכיב שבו היא התרחשה, סוג הדפדפן והמכשיר, ודרך ליצירת קשר חוזר.
                </p>
              </section>

              <section id="coordinator" class="legal-section">
                <h2 class="legal-section-title">7. רכז הנגישות</h2>
                <p>לפניות ובירורים בנושא נגישות ניתן ליצור קשר עם רכז הנגישות של החברה בדוא"ל:</p>
                <ul class="legal-list">
                  <li><strong>שם רכז הנגישות:</strong> {{ coordinatorName }}</li>
                  <li><strong>דואר אלקטרוני:</strong> <a :href="`mailto:${coordinatorEmail}`" class="legal-inline-link">{{ coordinatorEmail }}</a></li>
                </ul>
              </section>

              <section id="update" class="legal-section">
                <h2 class="legal-section-title">8. עדכון ההצהרה</h2>
                <p>
                  הצהרת נגישות זו עודכנה לאחרונה בתאריך {{ lastUpdated }}. אנו בוחנים את רמת הנגישות של
                  האתר מעת לעת ומעדכנים הצהרה זו בהתאם.
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
import { env } from '@plugins'
import { VThemeProvider } from 'vuetify/components'
import LandingNav from '@landing/components/LandingNav.vue'
import AppFooter from '@shared/components/layout/AppFooter.vue'

const coordinatorName = 'צוות KICK'
const coordinatorEmail = env.contact.email
const lastUpdated = '6 בספטמבר 2026'

const sections = [
  { id: 'standard', title: 'רמת הנגישות והתקן' },
  { id: 'scope', title: 'הדפים שהונגשו' },
  { id: 'measures', title: 'ההתאמות שבוצעו' },
  { id: 'limitations', title: 'מגבלות ידועות' },
  { id: 'physical-accessibility', title: 'הסדרי נגישות פיזיים' },
  { id: 'contact', title: 'פנייה בנושא נגישות' },
  { id: 'coordinator', title: 'רכז הנגישות' },
  { id: 'update', title: 'עדכון ההצהרה' },
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

@media (max-width: 600px) {
  .legal-toc-list {
    columns: 1;
  }
}
</style>
