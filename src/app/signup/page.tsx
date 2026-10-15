import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign up · Discussion Clone" };

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
