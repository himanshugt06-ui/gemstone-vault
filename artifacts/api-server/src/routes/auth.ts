import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

const OAUTH_COOKIE_TTL = 10 * 60 * 1000;

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host =
    req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? "").toLowerCase();
}

function isAdminEmail(email: string | null | undefined): boolean {
  return !!adminEmail() && !!email && email.toLowerCase() === adminEmail();
}

function buildAuthUser(dbUser: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}) {
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    profileImageUrl: dbUser.profileImageUrl,
    isAdmin: isAdminEmail(dbUser.email),
  };
}

// ── GET /auth/user ────────────────────────────────────────────────────────────
router.get("/auth/user", (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ user: null });
    return;
  }
  res.json({
    user: {
      ...req.user,
      isAdmin: isAdminEmail(req.user.email),
    },
  });
});

// ── POST /auth/signup ─────────────────────────────────────────────────────────
router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()));

    if (existing) {
      res
        .status(409)
        .json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [dbUser] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        passwordHash,
      })
      .returning();

    const authUser = buildAuthUser(dbUser);
    const sid = await createSession({ user: authUser } as SessionData);
    setSessionCookie(res, sid);
    res.status(201).json({ user: authUser });
  } catch (err) {
    req.log.error({ err }, "Signup error");
    res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()));

    if (!dbUser) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    if (!dbUser.passwordHash) {
      res.status(401).json({
        error: "This account uses Google Sign-In. Please use that instead.",
      });
      return;
    }

    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const authUser = buildAuthUser(dbUser);
    const sid = await createSession({ user: authUser } as SessionData);
    setSessionCookie(res, sid);
    res.json({ user: authUser });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ success: true });
});

// ── GET /auth/google ──────────────────────────────────────────────────────────
router.get("/auth/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    res.redirect("/?error=google_not_configured");
    return;
  }

  const state = crypto.randomBytes(16).toString("hex");
  const returnTo =
    typeof req.query.returnTo === "string" ? req.query.returnTo : "/";
  const callbackUrl = `${getOrigin(req)}/api/auth/google/callback`;

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_COOKIE_TTL,
  };
  res.cookie("google_state", state, cookieOpts);
  res.cookie("google_return_to", returnTo, cookieOpts);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");

  res.redirect(url.toString());
});

// ── GET /auth/google/callback ─────────────────────────────────────────────────
router.get("/auth/google/callback", async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.redirect("/?error=google_not_configured");
    return;
  }

  const { code, state } = req.query;
  const expectedState = req.cookies?.google_state as string | undefined;
  const returnTo = (req.cookies?.google_return_to as string | undefined) ?? "/";

  res.clearCookie("google_state", { path: "/" });
  res.clearCookie("google_return_to", { path: "/" });

  if (!code || !state || state !== expectedState) {
    res.redirect("/?error=google_auth_failed");
    return;
  }

  try {
    const callbackUrl = `${getOrigin(req)}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokens.access_token) {
      res.redirect("/?error=google_token_failed");
      return;
    }

    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      },
    );
    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    if (!googleUser.id) {
      res.redirect("/?error=google_userinfo_failed");
      return;
    }

    let dbUser = null;

    const [byGoogleId] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleUser.id));

    if (byGoogleId) {
      dbUser = byGoogleId;
    } else if (googleUser.email) {
      const [byEmail] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, googleUser.email.toLowerCase()));

      if (byEmail) {
        const [updated] = await db
          .update(usersTable)
          .set({
            googleId: googleUser.id,
            profileImageUrl:
              googleUser.picture ?? byEmail.profileImageUrl ?? null,
            updatedAt: new Date(),
          })
          .where(eq(usersTable.id, byEmail.id))
          .returning();
        dbUser = updated;
      }
    }

    if (!dbUser) {
      const [created] = await db
        .insert(usersTable)
        .values({
          email: googleUser.email?.toLowerCase() ?? null,
          firstName: googleUser.given_name ?? null,
          lastName: googleUser.family_name ?? null,
          profileImageUrl: googleUser.picture ?? null,
          googleId: googleUser.id,
        })
        .returning();
      dbUser = created;
    }

    const authUser = buildAuthUser(dbUser);
    const sid = await createSession({ user: authUser } as SessionData);
    setSessionCookie(res, sid);

    const safePath = returnTo.startsWith("/") ? returnTo : "/";
    res.redirect(safePath);
  } catch (err) {
    req.log.error({ err }, "Google OAuth callback error");
    res.redirect("/?error=google_auth_failed");
  }
});

// Legacy compat — redirect old OIDC logout URL
router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

// Keep mobile session logout for any existing mobile clients
router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) await deleteSession(sid);
  res.json({ success: true });
});

export default router;
