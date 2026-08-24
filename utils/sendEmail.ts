import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTPEmail = async (
  email: string,
  otp: string
) => {
  await transporter.sendMail({
    from: `"CodeNexa Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "CodeNexa Admin Password Reset OTP",

    html: `
      <!DOCTYPE html>
      <html>
        <body
          style="
            margin:0;
            padding:0;
            background:#f8fafc;
            font-family:Arial,sans-serif;
          "
        >

          <div
            style="
              max-width:600px;
              margin:40px auto;
              background:#ffffff;
              border:1px solid #e2e8f0;
              border-radius:16px;
              padding:40px;
            "
          >

            <h1
              style="
                margin:0 0 8px;
                color:#0f172a;
                font-size:26px;
              "
            >
              CodeNexa
            </h1>

            <p
              style="
                margin:0;
                color:#64748b;
                font-size:14px;
              "
            >
              Admin Password Reset
            </p>

            <div style="margin-top:30px;">

              <p
                style="
                  color:#334155;
                  font-size:15px;
                  line-height:1.6;
                "
              >
                We received a request to reset your
                CodeNexa admin password.
              </p>

              <p
                style="
                  color:#334155;
                  font-size:15px;
                "
              >
                Use the OTP below to continue:
              </p>

            </div>

            <div
              style="
                margin:30px 0;
                padding:24px;
                background:#f1f5f9;
                border-radius:14px;
                text-align:center;
              "
            >

              <p
                style="
                  margin:0 0 10px;
                  color:#64748b;
                  font-size:13px;
                "
              >
                Your OTP
              </p>

              <div
                style="
                  font-size:36px;
                  font-weight:bold;
                  letter-spacing:8px;
                  color:#2563eb;
                "
              >
                ${otp}
              </div>

            </div>

            <p
              style="
                color:#64748b;
                font-size:14px;
                line-height:1.6;
              "
            >
              This OTP is valid for
              <strong>10 minutes</strong>.
            </p>

            <p
              style="
                color:#94a3b8;
                font-size:12px;
                line-height:1.6;
                margin-top:30px;
              "
            >
              If you did not request a password reset,
              please ignore this email.
            </p>

            <div
              style="
                margin-top:30px;
                padding-top:20px;
                border-top:1px solid #e2e8f0;
              "
            >

              <p
                style="
                  margin:0;
                  color:#94a3b8;
                  font-size:11px;
                "
              >
                © CodeNexa — Admin Security
              </p>

            </div>

          </div>

        </body>
      </html>
    `,
  });
};