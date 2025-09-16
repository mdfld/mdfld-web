"use client";

import LoginFormFrameless from "@/components/loginForm/app";
import SignUpFormFrameless from "@/components/signupForm/app";
import { Tabs, Tab } from "@heroui/react";

export default function Login() {
	return (
		<div className="flex flex-col w-screen h-screen justify-center items-center">
			<div className="w-full max-w-md">
				<Tabs aria-label="Auth tabs" variant="underlined" fullWidth>
					<Tab key="login" title="Login">
						<div className="py-10">
							<LoginFormFrameless></LoginFormFrameless>
						</div>
					</Tab>
					<Tab key="signup" title="Sign Up">
						<div className="py-10">
							<SignUpFormFrameless></SignUpFormFrameless>
						</div>
					</Tab>
				</Tabs>
			</div>
		</div>
	);
}
