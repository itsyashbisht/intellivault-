import type * as React from "react";

interface WorkspaceInviteEmailProps {
  invitedByName: string;
  workspaceName: string;
  inviteLink: string;
  expiresInDays?: number;
}

export function WorkspaceInviteEmail({
  invitedByName,
  workspaceName,
  inviteLink,
  expiresInDays = 7,
}: WorkspaceInviteEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>You're invited to {workspaceName}</title>
      </head>
      <body style={styles.body}>
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={styles.outer}
        >
          <tr>
            <td align="center">
              <table
                width="520"
                cellPadding="0"
                cellSpacing="0"
                style={styles.card}
              >
                {/* ── Header ── */}
                <tr>
                  <td style={styles.header}>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td style={styles.logoWrap}>
                          <span style={styles.logoIcon}>⬡</span>
                          <span style={styles.logoText}>IntelliVault</span>
                        </td>
                      </tr>
                    </table>
                    <p style={styles.headerEyebrow}>Workspace Invitation</p>
                    <h1 style={styles.headerTitle}>You've been invited</h1>
                  </td>
                </tr>

                {/* ── Body ── */}
                <tr>
                  <td style={styles.body2}>
                    {/* Workspace badge */}
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={styles.workspaceBadge}
                    >
                      <tr>
                        <td style={styles.workspaceBadgeInner}>
                          <span style={styles.workspaceBadgeIcon}>◈</span>
                          <span style={styles.workspaceBadgeName}>
                            {workspaceName}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <p style={styles.paragraph}>
                      <strong style={styles.senderName}>{invitedByName}</strong>{" "}
                      has invited you to collaborate on the{" "}
                      <strong>{workspaceName}</strong> workspace on IntelliVault
                      — where your team's documents become instantly searchable
                      intelligence.
                    </p>

                    <p style={styles.paragraph}>
                      Click the button below to accept your invitation and join
                      the workspace.
                    </p>

                    {/* CTA Button */}
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={{ marginTop: "28px", marginBottom: "28px" }}
                    >
                      <tr>
                        <td align="center">
                          <a href={inviteLink} style={styles.button}>
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* Divider */}
                    <hr style={styles.divider} />

                    {/* Link fallback */}
                    <p style={styles.fallbackLabel}>
                      Or copy this link into your browser:
                    </p>
                    <p style={styles.fallbackLink}>{inviteLink}</p>

                    {/* Expiry notice */}
                    <table
                      width="100%"
                      cellPadding="0"
                      cellSpacing="0"
                      style={styles.expiryBox}
                    >
                      <tr>
                        <td style={styles.expiryBoxInner}>
                          <span style={styles.expiryIcon}>⏳</span>
                          <span style={styles.expiryText}>
                            This invitation expires in{" "}
                            <strong>{expiresInDays} days</strong>. After that
                            you'll need to request a new invite.
                          </span>
                        </td>
                      </tr>
                    </table>

                    <p style={styles.ignoreNote}>
                      If you weren't expecting this invitation, you can safely
                      ignore this email. No account will be created without your
                      action.
                    </p>
                  </td>
                </tr>

                {/* ── Footer ── */}
                <tr>
                  <td style={styles.footer}>
                    <p style={styles.footerText}>
                      © {new Date().getFullYear()} IntelliVault · Enterprise
                      Document Intelligence
                    </p>
                    <p style={styles.footerText}>
                      You received this because someone used your email to send
                      a workspace invite.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Inline styles required for email client compatibility.

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#0f0f10",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  outer: {
    backgroundColor: "#0f0f10",
    padding: "40px 16px",
  },
  card: {
    backgroundColor: "#18181b",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid #27272a",
    maxWidth: "520px",
    width: "100%",
  },

  // Header
  header: {
    background:
      "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    padding: "40px 40px 36px",
    borderBottom: "1px solid #27272a",
  },
  logoWrap: {
    display: "block",
    marginBottom: "24px",
  },
  logoIcon: {
    fontSize: "20px",
    color: "#6366f1",
    marginRight: "8px",
    verticalAlign: "middle",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#e4e4e7",
    letterSpacing: "0.04em",
    verticalAlign: "middle",
    fontFamily: "'Georgia', serif",
  },
  headerEyebrow: {
    margin: "0 0 8px",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#6366f1",
  },
  headerTitle: {
    margin: "0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#fafafa",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
  },

  // Body
  body2: {
    padding: "36px 40px",
  },
  workspaceBadge: {
    marginBottom: "24px",
  },
  workspaceBadgeInner: {
    display: "inline-block",
    backgroundColor: "#27272a",
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    padding: "10px 16px",
  },
  workspaceBadgeIcon: {
    fontSize: "14px",
    color: "#6366f1",
    marginRight: "8px",
  },
  workspaceBadgeName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#e4e4e7",
    letterSpacing: "0.01em",
  },
  paragraph: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#a1a1aa",
  },
  senderName: {
    color: "#e4e4e7",
    fontWeight: "600",
  },

  // Button
  button: {
    display: "inline-block",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    textDecoration: "none",
    borderRadius: "10px",
    padding: "14px 32px",
    letterSpacing: "0.01em",
  },

  // Divider
  divider: {
    border: "none",
    borderTop: "1px solid #27272a",
    margin: "28px 0",
  },

  // Fallback link
  fallbackLabel: {
    margin: "0 0 8px",
    fontSize: "12px",
    color: "#71717a",
    letterSpacing: "0.01em",
  },
  fallbackLink: {
    margin: "0 0 24px",
    fontSize: "12px",
    color: "#6366f1",
    wordBreak: "break-all" as const,
    fontFamily: "'Courier New', monospace",
  },

  // Expiry box
  expiryBox: {
    marginBottom: "24px",
  },
  expiryBoxInner: {
    backgroundColor: "#1c1917",
    border: "1px solid #292524",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#a8a29e",
    lineHeight: "1.5",
  },
  expiryIcon: {
    marginRight: "8px",
  },
  expiryText: {
    fontSize: "13px",
    color: "#a8a29e",
  },

  // Ignore note
  ignoreNote: {
    margin: "0",
    fontSize: "12px",
    color: "#52525b",
    lineHeight: "1.6",
    fontStyle: "italic",
  },

  // Footer
  footer: {
    backgroundColor: "#111113",
    borderTop: "1px solid #27272a",
    padding: "24px 40px",
    textAlign: "center" as const,
  },
  footerText: {
    margin: "0 0 6px",
    fontSize: "11px",
    color: "#52525b",
    lineHeight: "1.6",
    letterSpacing: "0.01em",
  },
};
