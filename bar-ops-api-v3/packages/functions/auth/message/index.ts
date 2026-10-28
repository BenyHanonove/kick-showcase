// Import external framework dependencies and status codes from third party packages
import { CustomMessageTriggerEvent } from 'aws-lambda';

// Process auth message operation request and return JSON HTTP response
export const handler = async (event: CustomMessageTriggerEvent): Promise<CustomMessageTriggerEvent> => {
    if (event.triggerSource === "CustomMessage_SignUp" || event.triggerSource === "CustomMessage_ResendCode") {

        // Use the link parameter provided by Cognito configuration setting for
        const link = event.request.linkParameter;

        event.response.emailSubject = "ברוכים הבאים ל-BarOps! אמת את המייל שלך";
        event.response.emailMessage = `
            <html>
                <body dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; padding: 20px; color: #333;">
                    <h2 style="color: #007bff;">היי! איזה כיף שהצטרפת ל-BarOps 🍻</h2>
                    <p style="font-size: 16px;">אנחנו מתרגשים להתחיל לעבוד ביחד. כדי שנוכל לצאת לדרך, נשאר רק צעד אחד קטן - לאמת את כתובת האימייל שלך.</p>
                    
                    <p style="font-size: 16px;">לחץ על הכפתור למטה כדי להפעיל את החשבון באופן מיידי:</p>
                    
                    <div style="margin: 25px 0;">
                        <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                            {##לחץ כאן לאימות החשבון##}
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;">
                    <p style="font-size: 12px; color: #999;">נשלח באהבה מצוות BarOps</p>
                </body>
            </html>`;

        event.response.smsMessage = `אמת את החשבון שלך בקישור הבא: ${link}`;
    }

    return event;
};