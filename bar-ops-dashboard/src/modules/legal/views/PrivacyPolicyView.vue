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
                <span class="legal-tag" dir="ltr">KICK · PRIVACY POLICY</span>
              </div>
              <h1 class="legal-title">מדיניות פרטיות</h1>
              <p class="legal-date">עודכן לאחרונה: {{ lastUpdated }}</p>
              <p class="legal-lead">
                מדיניות פרטיות זו מסבירה כיצד <strong>KICK</strong> ("אנחנו", "שלנו") אוספת, משתמשת,
                שומרת ומשתפת מידע אישי במסגרת מערכת הניהול הדיגיטלית שלנו (האתר בכתובת
                kicks.ltd, "המערכת") ובמסגרת התקשורת שאנו מקיימים מול עובדים בערוץ
                WhatsApp. מדיניות זו חלה על עובדים ומועמדים לעבודה הנרשמים דרך טופס ההרשמה העצמית
                שלנו, על מנהלים ומשתמשי מערכת בעלי הרשאת כניסה, ועל אנשי קשר אצל לקוחות וספקים
                שפרטיהם מוזנים על ידי הצוות שלנו לצורך ניהול העבודה השוטפת. שימוש במערכת ומסירת מידע
                אלינו מהווים הסכמה לתנאי מדיניות זו.
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
        <section id="intro" class="pp-section">
          <h2 class="text-h6 font-weight-medium">1. מי אנחנו</h2>
          <p class="text-body-1">
            KICK היא מערכת לניהול צוותי עבודה, משמרות ואירועים בענף הברים והאירועים. מדיניות זו
            חלה על השירות כולו, לרבות ההודעות שאנו שולחים לעובדים דרך WhatsApp.
          </p>
        </section>

        <section id="collect" class="pp-section">
          <h2 class="text-h6 font-weight-medium">2. המידע שאנו אוספים</h2>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">2.1 פרטי עובדים ומועמדים</h3>
          <p class="text-body-1">
            בעת הרשמה עצמית לעבודה (או הזנת פרטים על ידי מנהל) אנו אוספים: שם פרטי ושם משפחה,
            מספר תעודת זהות, מספר טלפון נייד, כתובת מגורים, שם משתמש באינסטגרם, פירוט ניסיון
            תעסוקתי, וכן נתוני תפקיד וסטטוס העסקה במערכת. מספר תעודת הזהות הוא מידע מזהה רגיש
            במיוחד, ואנו מגבילים את הגישה אליו לבעלי הרשאה מתאימה בלבד.
          </p>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">2.2 נתוני משמרות והעסקה</h3>
          <p class="text-body-1">
            לכל עובד המשובץ למשמרת אנו שומרים: תאריך ושעות המשמרת, שעות כניסה ויציאה בפועל
            (החתמת נוכחות), תעריף שעתי ותשלומי בונוס, הערות תפעוליות, ובמידת הצורך שיוך לרכב
            ולוחית רישוי לצורך תיאום הסעות.
          </p>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">
            2.3 פרטי משתמשי מערכת (מנהלים וצוות ניהול)
          </h3>
          <p class="text-body-1">
            משתמשים בעלי הרשאת כניסה מזוהים באמצעות שירות הזדהות חיצוני (Amazon Cognito), לפיו
            אנו שומרים: כתובת אימייל, שם פרטי ושם משפחה ורמת ההרשאה במערכת (למשל מנהל/אדמין).
            הסיסמה עצמה מנוהלת ומוצפנת במלואה על ידי Amazon Cognito, אינה נשמרת אצלנו כטקסט גלוי
            ואיננו יכולים לצפות בה.
          </p>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">2.4 נתוני אירועים, מכירות וכספים</h3>
          <p class="text-body-1">
            במסגרת ניהול אירועים אנו שומרים נתונים כגון: שם האירוע ומיקומו (כתובת או שם מקום
            בטקסט חופשי — איננו אוספים מיקום GPS), פרטי הלקוח המזמין המשויך לאירוע, הצעות מחיר,
            מקדמות ותנאי תשלום, סיכומי מכירות (מזומן, אשראי, טיפים) והוצאות, וכן קבצים המועלים
            למערכת כגון צילומי קבלות, דוחות קופה (Z) ומסמכים נלווים (למשל הסכמים) — אלו עשויים
            להכיל מידע אישי מוגבל בהתאם לתוכנם.
          </p>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">2.5 פרטי לקוחות וספקים</h3>
          <p class="text-body-1">
            לגבי לקוחות (מזמיני אירועים) וספקים אנו שומרים: שם, שם עסק או מותג, איש קשר, מספר
            טלפון, כתובת אימייל (ככל שנמסרה) וכתובת — לצורך ניהול ההתקשרות העסקית מולם. פרטים
            אלה מוזנים על ידי הצוות שלנו, ואינם נאספים ישירות מהלקוח או הספק דרך המערכת.
          </p>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">2.6 תקשורת ב-WhatsApp</h3>
          <p class="text-body-1">
            אנו יוצרים קשר עם עובדים בערוץ WhatsApp (באמצעות WhatsApp Business Cloud API של
            Meta) לצורך שיבוץ ועדכוני משמרות, עדכוני פרטים אישיים וכניסה למערכת. הודעות אלו
            עשויות לכלול: מספר הטלפון של העובד, שם פרטי ומשפחה, פרטי המשמרת (תאריך, שעה ומיקום),
            קישור אישי לעדכון פרטים וקוד אימות חד-פעמי (OTP) לצורך זיהוי.
          </p>

          <h3 class="text-subtitle-1 font-weight-medium mt-4">2.7 מידע טכני</h3>
          <p class="text-body-1">
            ספקי התשתית שלנו (ראו סעיף 6) אוספים באופן אוטומטי נתוני חיבור בסיסיים הנדרשים
            להפעלת שירות אינטרנט תקין (כגון כתובת IP), לצורך תפעול, אבטחה ומניעת שימוש לרעה
            במערכת. בנוסף, לצורך עדכונים בזמן אמת (כגון התראות חיות במערכת), אנו שומרים לפרק זמן
            מוגבל מזהה חיבור, מזהה משתמש וחותמת זמן.
          </p>
        </section>

        <section id="statutory-notice" class="pp-section">
          <h2 class="text-h6 font-weight-medium">3. הודעה סטטוטורית לפי סעיף 11 לחוק הגנת הפרטיות (חובת יידוע)</h2>
          <p class="text-body-1">
            בעת מסירת פרטים אישיים באתר ובמערכת (לרבות בטופס הגשת מועמדות לעבודה, טופס השארת פרטים לאירוע או עדכון פרטי עובד), מובא בזאת לידיעתך כי:
          </p>
          <ul class="pp-list">
            <li><strong>היעדר חובה חוקית:</strong> לא חלה עליך כל חובה חוקית למסור את המידע האישי, ומסירתו נעשית בהסכמתך ומרצונך החופשי המלא.</li>
            <li><strong>מטרת מסירת המידע:</strong> המידע נמסר לשם בחינת התאמה להעסקה, שיבוץ למשמרות, תשלום שכר, יצירת קשר לתיאום והצעות מחיר לאירועים, ניהול תפעולי שוטף של שירותי הבר, ואבטחת המערכת.</li>
            <li><strong>השלכות אי-מסירת המידע:</strong> ללא מסירת הפרטים המוגדרים כשדות חובה (כגון שם, טלפון, ומספר ת"ז לצורך העסקה כדין), לא נוכל לבחון את מועמדותך, לשבצך במשמרות או לספק לך הצעת מחיר והתקשרות לאירוע.</li>
            <li><strong>צדדים שלישיים:</strong> המידע יועבר אך ורק לספקי תשתית טכנולוגיים לצורך תפעול השירות (כמפורט בסעיף 6 להלן), ולא יימסר לצדדים שלישיים לצרכים פרסומיים ללא הסכמתך המפורשת.</li>
          </ul>
        </section>

        <section id="how" class="pp-section">
          <h2 class="text-h6 font-weight-medium">4. כיצד אנו אוספים את המידע</h2>
          <p class="text-body-1">
            אנו אוספים מידע כאשר: (א) אתם ממלאים את טופס ההרשמה העצמית לעבודה; (ב) צוות הניהול
            שלנו מזין או מעדכן פרטים במערכת (למשל פרטי משמרת, לקוח או ספק); (ג) אתם משתמשים
            במערכת לאחר התחברות, לרבות תיעוד שעות עבודה ופעולות תפעוליות; (ד) אתם מגיבים לקישור
            או טופס שנשלח אליכם ב-WhatsApp.
          </p>
        </section>

        <section id="use" class="pp-section">
          <h2 class="text-h6 font-weight-medium">5. השימוש במידע</h2>
          <p class="text-body-1">אנו משתמשים במידע שנאסף לצרכים הבאים בלבד:</p>
          <ul class="pp-list">
            <li>ניהול שיבוץ עובדים למשמרות ותיאום מולם</li>
            <li>חישוב שכר, בונוסים ותשלומים</li>
            <li>אימות זהות וניהול הרשאות גישה למערכת</li>
            <li>תקשורת תפעולית (עדכוני משמרות, בקשות לעדכון פרטים)</li>
            <li>ניהול אירועים, מכירות ודוחות כספיים עבור העסק</li>
            <li>שמירה על אבטחת המערכת ומניעת שימוש לרעה</li>
            <li>עמידה בחובות חוקיות החלות עלינו, לרבות ניהול רישומי שכר ותיעוד עסקי</li>
          </ul>
        </section>

        <section id="share" class="pp-section">
          <h2 class="text-h6 font-weight-medium">6. שיתוף מידע עם צדדים שלישיים</h2>
          <p class="text-body-1">
            אנו לא מוכרים ולא משכירים מידע אישי לצדדים שלישיים לצרכי שיווק. אנו משתפים מידע עם
            ספקי שירות המפעילים את התשתית הטכנולוגית של המערכת מטעמנו, בהתאם להסכמי השימוש שלהם,
            ובהיקף הנדרש בלבד:
          </p>
          <ul class="pp-list">
            <li>
              <strong>Amazon Web Services (AWS)</strong> — לרבות Cognito (ניהול זהויות
              והתחברות), DynamoDB (בסיס הנתונים), S3 (אחסון קבצים, תמונות ומסמכים), SES (שליחת
              הודעות אימות והתחברות באימייל), ותשתית ההרצה של המערכת (Lambda, API Gateway,
              EventBridge) ויומני תפעול (CloudWatch).
            </li>
            <li><strong>Meta Platforms, Inc.</strong> — לצורך שליחת הודעות WhatsApp לעובדים.</li>
            <li>
              שירות מטמון פנימי (Redis) המשמש לשיפור ביצועי המערכת, ושומר עותק זמני של נתונים
              לפרק זמן קצר בלבד.
            </li>
          </ul>
          <p class="text-body-1">
            ייתכן שנחשוף מידע נוסף אם נידרש לכך על פי דין, צו בית משפט, או כדי להגן על זכויותינו
            החוקיות.
          </p>
        </section>

        <section id="cookies" class="pp-section">
          <h2 class="text-h6 font-weight-medium">7. עוגיות ואחסון מקומי</h2>
          <p class="text-body-1">
            המערכת אינה משתמשת בעוגיות פרסום, מעקב או אנליטיקס. עוגיה יחידה, מוצפנת ומאובטחת
            (HttpOnly), נשמרת בדפדפן לצורך שמירת ההתחברות שלכם (Refresh Token) ותוקפה עד כ-30
            יום. בנוסף, המערכת שומרת באחסון המקומי של הדפדפן (Local Storage) טיוטות עבודה שוטפות
            (כגון אירועים, הצעות מחיר ומכירות בתהליך) כדי למנוע אובדן מידע — נתונים אלו נותרים
            במכשירכם ואינם משמשים למעקב פרסומי.
          </p>
        </section>

        <section id="security" class="pp-section">
          <h2 class="text-h6 font-weight-medium">8. אבטחת מידע</h2>
          <p class="text-body-1">אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע, לרבות:</p>
          <ul class="pp-list">
            <li>הצפנת תעבורה (HTTPS) והצפנת נתונים במנוחה כברירת מחדל אצל ספק הענן שלנו</li>
            <li>
              שמירת אסימוני התחברות (Access/ID Token) בזיכרון הדפדפן בלבד, ומחיקתם בכל רענון עמוד
            </li>
            <li>
              קישורי עדכון פרטים לעובדים המוגנים בקוד אימות חד-פעמי, עם תוקף מוגבל (כשעה) ומספר
              ניסיונות מוגבל
            </li>
            <li>בקרת הרשאות המבוססת על תפקיד (עובד / מנהל / אדמין)</li>
            <li>
              מנגנון המשחיר שדות רגישים (כגון סיסמאות, אסימונים, כתובות אימייל וטלפון) בטרם רישום
              ביומני המערכת
            </li>
          </ul>
          <p class="text-body-1">
            עם זאת, אין אפשרות להבטיח אבטחה מוחלטת של מידע המועבר או מאוחסן באופן דיגיטלי.
          </p>
        </section>

        <section id="retention" class="pp-section">
          <h2 class="text-h6 font-weight-medium">9. שמירת מידע ומחיקתו</h2>
          <p class="text-body-1">
            אנו שומרים מידע אישי למשך הזמן הנדרש למימוש המטרות המפורטות במדיניות זו — ככלל, למשך
            תקופת ההעסקה או ההתקשרות העסקית, ולאחריה בהתאם לחובות חוקיות ורישומיות (למשל רישומי
            שכר). ניתן לבקש מחיקה או עדכון של מידע שאינו נדרש עוד לשמירה כאמור, בהתאם לזכויות
            המפורטות בסעיף הבא.
          </p>
        </section>

        <section id="rights" class="pp-section">
          <h2 class="text-h6 font-weight-medium">10. הזכויות שלך</h2>
          <p class="text-body-1">
            בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו, ובכפוף להוראות כל דין, עומדות לך
            הזכויות הבאות ביחס למידע האישי שלך המוחזק אצלנו:
          </p>
          <ul class="pp-list">
            <li>זכות לעיין במידע שנאסף עליך</li>
            <li>זכות לבקש תיקון של מידע שגוי או לא מדויק</li>
            <li>זכות לבקש מחיקת מידע, ככל שאינו נדרש עוד לצורך חוקי או עסקי</li>
            <li>זכות להתנגד לשימוש מסוים במידע שמסרת מרצון</li>
          </ul>
          <p class="text-body-1">למימוש זכויות אלה, ניתן לפנות אלינו בפרטי הקשר שבסעיף 13.</p>
        </section>

        <section id="minors" class="pp-section">
          <h2 class="text-h6 font-weight-medium">11. קטינים</h2>
          <p class="text-body-1">
            המערכת מיועדת לשימוש עסקי על ידי בגירים (מגיל 18 ומעלה) בלבד, ואיננו אוספים ביודעין
            מידע על קטינים. אם נודע לנו כי נאסף מידע על קטין ללא הסכמת הורה או אפוטרופוס כנדרש
            בדין, נפעל למחיקתו.
          </p>
        </section>

        <section id="changes" class="pp-section">
          <h2 class="text-h6 font-weight-medium">12. שינויים במדיניות זו</h2>
          <p class="text-body-1">
            אנו עשויים לעדכן מדיניות זו מעת לעת בהתאם לשינויים במערכת או בדרישות הדין. גרסה
            מעודכנת תפורסם בעמוד זה בצירוף תאריך העדכון האחרון. המשך השימוש במערכת לאחר פרסום
            עדכון מהווה הסכמה לתנאים המעודכנים.
          </p>
        </section>

        <section id="contact" class="pp-section">
          <h2 class="text-h6 font-weight-medium">13. יצירת קשר</h2>
          <p class="text-body-1">
            לשאלות בנוגע למדיניות זו, או למימוש הזכויות המפורטות לעיל, ניתן לפנות אלינו:
          </p>
          <p class="text-body-1 font-weight-medium">
            <a :href="`mailto:${contactEmail}`">{{ contactEmail }}</a>
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
  { id: 'intro', title: 'מי אנחנו' },
  { id: 'collect', title: 'המידע שאנו אוספים' },
  { id: 'statutory-notice', title: 'הודעה סטטוטורית (סעיף 11)' },
  { id: 'how', title: 'כיצד אנו אוספים את המידע' },
  { id: 'use', title: 'השימוש במידע' },
  { id: 'share', title: 'שיתוף מידע עם צדדים שלישיים' },
  { id: 'cookies', title: 'עוגיות ואחסון מקומי' },
  { id: 'security', title: 'אבטחת מידע' },
  { id: 'retention', title: 'שמירת מידע ומחיקתו' },
  { id: 'rights', title: 'הזכויות שלך' },
  { id: 'minors', title: 'קטינים' },
  { id: 'changes', title: 'שינויים במדיניות זו' },
  { id: 'contact', title: 'יצירת קשר' },
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

.pp-section {
  scroll-margin-top: 100px;
  padding-block: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.pp-section:last-child {
  border-bottom: none;
}

.pp-section h2 {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 12px;
}

.pp-section h3 {
  font-family: 'Heebo', 'Assistant', sans-serif;
  font-size: 0.98rem;
  font-weight: 700;
  color: #34d399;
  margin: 16px 0 8px;
}

.pp-section p {
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 10px;
}

.pp-section p:last-child {
  margin-bottom: 0;
}

.legal-inline-link,
.pp-section a {
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.legal-inline-link:hover,
.pp-section a:hover {
  color: #34d399;
  text-decoration: underline;
}

.pp-list {
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
