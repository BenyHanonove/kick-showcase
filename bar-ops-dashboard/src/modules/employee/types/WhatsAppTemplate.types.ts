// Mirrors the approved Meta templates the API sends - update here when a template changes in Meta
export enum WhatsAppTemplate {
  SHIFT_ASSIGNMENT_NOTICE = 'shift_assignment_notice',
  SHIFT_AVAILABILITY_REQUEST = 'shift_availability_request',
  EMPLOYEE_DETAILS_UPDATE = 'employee_details_update',
}

// A single {{n}} placeholder inside the template body
export interface IWhatsAppTemplateParam {
  index: number
  label: string
  sample: string
}

// URL button appended under the bubble, its value is filled at send time
export interface IWhatsAppTemplateButton {
  label: string
  icon: string
  note: string
}

export interface IWhatsAppTemplateDefinition {
  name: WhatsAppTemplate
  title: string
  description: string
  icon: string
  trigger: string
  header: string
  body: string
  footer: string
  params: IWhatsAppTemplateParam[]
  button?: IWhatsAppTemplateButton
}

// Body text is copied verbatim from the approved Hebrew templates
export const WhatsAppTemplates: Record<WhatsAppTemplate, IWhatsAppTemplateDefinition> = {
  [WhatsAppTemplate.SHIFT_ASSIGNMENT_NOTICE]: {
    name: WhatsAppTemplate.SHIFT_ASSIGNMENT_NOTICE,
    title: 'שיבוץ למשמרת',
    description: 'נשלחת לכל עובד המשובץ במשמרת באירוע',
    icon: 'mdi-calendar-check-outline',
    trigger: 'שידור תזמונים מתוך ניהול המשמרות של האירוע',
    header: 'שיבוץ למשמרת',
    body: [
      'היי {{1}},',
      'שובצת למשמרת הבאה מטעם KICK 🍸',
      '',
      '📍 אירוע: {{2}}',
      '🗓️ מועד: {{3}}',
      '',
      'לשינויים או בירורים יש לפנות למנהל המשמרת.',
    ].join('\n'),
    footer: 'KICK',
    params: [
      { index: 1, label: 'שם פרטי של העובד', sample: 'שון' },
      { index: 2, label: 'שם האירוע', sample: 'אירוע חברה בגן האירועים' },
      { index: 3, label: 'מועד המשמרת', sample: 'יום שלישי, 19 באוגוסט, 20:00' },
    ],
  },

  [WhatsAppTemplate.SHIFT_AVAILABILITY_REQUEST]: {
    name: WhatsAppTemplate.SHIFT_AVAILABILITY_REQUEST,
    title: 'הרשמה למשמרת',
    description: 'נשלחת לעובדים כשנפתחת הרשמה למשמרות באירוע',
    icon: 'mdi-clipboard-text-clock-outline',
    trigger: 'פתיחת הרשמה למשמרות באירוע - התבנית מאושרת אך עדיין לא מחוברת לשליחה מהמערכת',
    header: 'הרשמה למשמרת',
    body: [
      'היי {{1}},',
      'נפתחה ההרשמה למשמרות באירוע הקרוב של KICK 🍸',
      '',
      '📍 אירוע: {{2}}',
      '🗓️ מועד: {{3}}',
      '📌 מיקום: {{4}}',
      '',
      'השיבוץ נסגר לפי סדר ההרשמה, ומספר המקומות מוגבל.',
      'לאישור זמינות יש ללחוץ על הכפתור מטה.',
      '',
      'הקישור בתוקף ל-24 שעות.',
    ].join('\n'),
    footer: 'KICK',
    params: [
      { index: 1, label: 'שם פרטי של העובד', sample: 'שון' },
      { index: 2, label: 'שם האירוע', sample: 'אירוע חברה בגן האירועים' },
      { index: 3, label: 'מועד האירוע', sample: 'יום שלישי, 19 באוגוסט, 20:00' },
      { index: 4, label: 'מיקום האירוע', sample: 'גן האירועים, ראשון לציון' },
    ],
    button: {
      label: 'Visit website',
      icon: 'mdi-open-in-new',
      note: 'הכפתור נושא טוקן הרשמה בתוקף ל-24 שעות',
    },
  },

  [WhatsAppTemplate.EMPLOYEE_DETAILS_UPDATE]: {
    name: WhatsAppTemplate.EMPLOYEE_DETAILS_UPDATE,
    title: 'עדכון פרטים אישיים',
    description: 'נשלחת לעובד יחיד עם קישור אישי לעדכון הפרטים',
    icon: 'mdi-account-edit-outline',
    trigger: 'שליחת קישור עדכון פרטים מכרטיס העובד',
    header: 'עדכון פרטים אישיים',
    body: [
      'היי {{1}},',
      'נדרש עדכון של הפרטים האישיים שלך במערכת KICK 🍸',
      'לעדכון יש ללחוץ על הכפתור מטה.',
      '',
      'הקישור בתוקף לשעה אחת בלבד.',
    ].join('\n'),
    footer: 'KICK',
    params: [{ index: 1, label: 'שם פרטי של העובד', sample: 'שון' }],
    button: {
      label: 'עדכון פרטים',
      icon: 'mdi-open-in-new',
      note: 'הכפתור נושא טוקן חד־פעמי בתוקף לשעה אחת',
    },
  },
}

// Broadcast from a session's shift manager
export const SessionWhatsAppTemplates: IWhatsAppTemplateDefinition[] = [
  WhatsAppTemplates[WhatsAppTemplate.SHIFT_ASSIGNMENT_NOTICE],
  WhatsAppTemplates[WhatsAppTemplate.SHIFT_AVAILABILITY_REQUEST],
]

// Sent to a single employee from their card
export const EmployeeWhatsAppTemplates: IWhatsAppTemplateDefinition[] = [
  WhatsAppTemplates[WhatsAppTemplate.EMPLOYEE_DETAILS_UPDATE],
]
