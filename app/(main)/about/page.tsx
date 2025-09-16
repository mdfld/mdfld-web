import UserSwitcher, {
	UserTrigger,
} from "@/components/dashboard/user-switcher";

export default function AboutPage() {
	return (
		<div>
			<UserSwitcher></UserSwitcher>
			<UserTrigger></UserTrigger>
		</div>
	);
}
