import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { playerKeyFromGoogleSub } from "@/lib/player-identity";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Auth.js (next-auth v5) session. The JWT lives in an httpOnly cookie.
 * Google is registered only when the server-side client id and secret exist,
 * so the game still runs for guests before OAuth is configured.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { error: "/auth/error" },
  providers:
    googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // openid identifies the account. profile supplies name and picture.
            // Email, Gmail, Drive, and other Google APIs are not requested.
            authorization: {
              params: {
                scope: "openid profile",
                prompt: "select_account",
              },
            },
            checks: ["pkce", "state", "nonce"],
            profile(profile) {
              const id = playerKeyFromGoogleSub(profile.sub)?.slice("google:".length) ?? "";
              return {
                id,
                name: profile.name ?? null,
                image: profile.picture ?? null,
                email: null,
              };
            },
          }),
        ]
      : [],
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      return playerKeyFromGoogleSub(profile?.sub) !== null;
    },
    jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        const key = playerKeyFromGoogleSub(profile?.sub);
        if (!key) return token;
        token.sub = key.slice("google:".length);
      }
      delete token.email;
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
      }
      return session;
    },
  },
});
