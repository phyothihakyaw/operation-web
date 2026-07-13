import { mentorApplications } from "./_components/data";
import { MentorApplications } from "./_components/mentor-applications";

export default function Page() {
  return <MentorApplications initialApplications={mentorApplications} />;
}
