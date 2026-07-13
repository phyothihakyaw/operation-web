import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard/mentors");
  return <>Coming Soon</>;
}
