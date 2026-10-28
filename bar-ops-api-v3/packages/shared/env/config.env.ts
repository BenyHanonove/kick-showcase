export enum AwsConfigKey {
  GLOBAL_BUCKET = "GLOBAL_BUCKET",
  SES_FROM_ADDRESS = "SES_FROM_ADDRESS",
  REDIS_HOST = "REDIS_HOST",
  REDIS_PORT = "REDIS_PORT",
  REDIS_PASSWORD = "REDIS_PASSWORD",
  REDIS_PASSWORD_PARAM = "REDIS_PASSWORD_PARAM",
  WHATSAPP_ACCESS_TOKEN = "WHATSAPP_ACCESS_TOKEN",
  WHATSAPP_PHONE_NUMBER_ID = "WHATSAPP_PHONE_NUMBER_ID",
  WHATSAPP_BUSINESS_ACCOUNT_ID = "WHATSAPP_BUSINESS_ACCOUNT_ID",
  WHATSAPP_COUNTRY_CODE = "WHATSAPP_COUNTRY_CODE",
}

// AWS configuration loaded directly from environment variables.
export const AWS_CONFIG = {
  region: process.env.AWS_REGION,
  s3: {
    globalBucket: process.env.GLOBAL_BUCKET,
  },
  sesFromAddress: process.env.SES_FROM_ADDRESS,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    passwordParam: process.env.REDIS_PASSWORD_PARAM,
  },
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    countryCode: process.env.WHATSAPP_COUNTRY_CODE ?? "+972",
  },
} as const;
