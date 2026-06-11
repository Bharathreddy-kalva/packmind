import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AtmosphericBackground } from "@/components/atmospheric-background";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-4 text-white">
      <AtmosphericBackground />
      <SignIn />
    </div>
  );
}
