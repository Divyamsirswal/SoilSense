import NextAuth from "next-auth";
import { authOptions } from "../auth-options";

// Create handler with the options
const handler = NextAuth(authOptions);

// Export the handler functions directly
export { handler as GET, handler as POST };
