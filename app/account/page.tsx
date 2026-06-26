import { redirect } from "next/navigation";
import { AccountClient } from "@/components/account/AccountClient";
import { getAccountProfile } from "@/lib/actions/account";

export default async function AccountPage() {
  const profile = await getAccountProfile();
  if (!profile) redirect("/login?from=/account");
  return <AccountClient profile={profile} />;
}
