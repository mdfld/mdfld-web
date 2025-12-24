"use client";

import { Button } from "@heroui/button";

export const LatestPosts = () => {
  return (
    <>
      <div className="shadow-lg relative w-[90vw] p-20 py-30 m-20 bg-[url('https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjauGy05YJCcXEpjeYRotmv6OulHiD75ygL13f')] bg-cover bg-center">
        <div className="absolute inset-0 backdrop-grayscale backdrop-brightness-80 backdrop-contrast-120"></div>
        <div className="absolute inset-0 bg-teal-500/50 mix-blend-color"></div>
        <div className="relative z-10 flex flex-col gap-10">
          <p className="text-5xl font-bold uppercase">Latest Posts.</p>
          <p className="text-sm">
            Stay updated with the latest news, insights, and exclusive content
            from the world of football!
            <br /> Never miss out on updates, trends, and stories that matter to
            fans and players alike!
          </p>
          <div className="flex">
            <Button
              className="p-6 px-15 font-semibold uppercase"
              color="primary"
              radius="full"
              as="a"
              href="https://www.instagram.com/mdfldmarketplace/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
