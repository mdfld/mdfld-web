"use client";

import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export const Topbar = () => {
  const router = useRouter();

  return (
    <>
      <div className="relative flex text-xs text-white bg-teal-400 z-10 items-center justify-end">
        <p className="absolute left-1/2 transform -translate-x-1/2 capitalize">
          free standard shipping on all orders over $200
        </p>
        <div className="flex gap-2 px-4 md:px-20 items-center">
          <Button variant="light" size="sm">
            Delivery
          </Button>
          <span className="">|</span>
          <Button variant="light" size="sm">
            Return
          </Button>
          <span>|</span>
          <div className="flex items-center align-middle gap-2 opacity-80">
            <Icon icon="uil:globe" width={20}></Icon>
            <span>En</span>
          </div>
        </div>
      </div>
    </>
  );
};
