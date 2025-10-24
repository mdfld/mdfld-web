import { useSession } from "@/lib/auth-client";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/react";

import { useRouter } from "next/navigation";

export const WelcomeHero = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) return null;

  return (
    <div className="m-4 relative overflow-hidden">
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Main Hero Card */}
      <div className="bg-gradient-to-br from-content1 to-content2/50 backdrop-blur-xl border border-divider/50 rounded-3xl p-8 min-h-[14rem] flex flex-col justify-between shadow-large animate-[fadeInUp_0.6s_ease-out]">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/3 rounded-full blur-2xl"></div>

        {/* Top Section */}
        <div className="flex justify-between items-start z-10 relative">
          {/* Welcome Message */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-default-500 mb-1 animate-[fadeInUp_0.6s_ease-out]">
              Welcome back
            </span>
            <h1 className="text-4xl font-bold text-foreground animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
              {session?.user.name}
            </h1>
            <div className="w-12 h-1 bg-primary rounded-full mt-2 animate-[fadeInUp_1s_ease-out_0.4s_both]"></div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-content1/80 backdrop-blur-sm rounded-full border border-divider/30">
            <Icon
              icon="svg-spinners:blocks-wave"
              width={16}
              height={16}
              className="text-primary"
            />
            <span className="text-xs font-medium text-default-600">Live</span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between items-end z-10 relative">
          {/* CTA Text */}
          <div className="flex flex-col">
            <p className="text-lg font-medium text-foreground/90 mb-1 animate-[fadeInUp_0.8s_ease-out]">
              Ready to explore?
            </p>
            <p className="text-sm text-default-500 animate-[fadeInUp_1s_ease-out_0.2s_both]">
              Choose your next action
            </p>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              variant="flat"
              className="h-12 px-6 bg-content1/60 backdrop-blur-sm border border-divider/30 hover:bg-primary hover:text-primary-foreground hover:border-primary/30 transition-all duration-300 group"
              startContent={
                <Icon
                  icon="solar:heart-bold"
                  width={20}
                  className="group-hover:scale-110 transition-transform"
                />
              }
              onPress={() => router.push("/dashboard/wishlist")}
            >
              Wishlist
            </Button>
            <Button
              size="lg"
              color="primary"
              className="h-12 px-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
            >
              Add Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
