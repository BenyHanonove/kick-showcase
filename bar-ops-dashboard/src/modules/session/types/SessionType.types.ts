export enum SessionType {
  NATURE_PARTY = 'nature_party',
  CONCERT = 'concert',
  TECHNO = 'techno',
  HOUSE = 'house',
  HARDSTYLE = 'hardstyle',
}

export const SessionTypeLabels: Record<SessionType, string> = {
  [SessionType.NATURE_PARTY]: 'מסיבת טבע',
  [SessionType.CONCERT]: 'הופעה',
  [SessionType.TECHNO]: 'טכנו',
  [SessionType.HOUSE]: 'האוס',
  [SessionType.HARDSTYLE]: 'הארדסטייל',
}
