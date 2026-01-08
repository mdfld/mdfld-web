"use client";

import type { NavbarProps } from "@heroui/react";

import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Button,
  Divider,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Image as HeroImage,
} from "@heroui/react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { authClient } from "@/lib/auth-client";

import { siteConfig } from "@/config/site";
import Link from "next/link";
import NextLink from "next/link";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { useGuestCart } from "@/hooks/use-guest-cart";

export default function MainNavbar(props: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const guestCart = useGuestCart();

  // Get cart items count
  const { data: cartData } = trpc.cart.get.useQuery(undefined, {
    enabled: !!session?.user,
  }) as any;
  const cartCount = session?.user
    ? (cartData?.itemCount || 0)
    : guestCart.getCartData().itemCount;

  // Get wishlist items
  const [wishlistItems, setWishlistItems] = React.useState<any[]>([]);
  const wishlistCount = wishlistItems.length;

  React.useEffect(() => {
    if (session?.user) {
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((data) => setWishlistItems(data.items || []))
        .catch(() => setWishlistItems([]));
    }
  }, [session]);

  return (
    <Navbar
      {...props}
      classNames={{
        base: cn("border-default-100", {
          "bg-default dark:bg-default-100": isMenuOpen,
        }),
        wrapper: "w-full justify-center",
        item: "hidden md:flex",
      }}
      height="60px"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      {/* Left Content */}
      <NavbarBrand className="bg-transparent">
        <NextLink href="/" className="text-background rounded-full">
          <Image
            src="https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjlsYla8wKE2TjwSU8x3apY10zR5NV9ighPDtr"
            alt="mdfld logo"
            width={100}
            height={10}
            className="bg-transparent cursor-pointer"
          ></Image>
        </NextLink>
      </NavbarBrand>

      {/* Center Content */}
      <NavbarContent justify="center" className="align-middle">
        <ul className="hidden align-middle lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem
              className="uppercase font-normal text-sm tracking-wide"
              key={item.href}
            >
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground", size: "sm" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      {/* Right Content */}
      <NavbarContent className="hidden md:flex" justify="end">
        <NavbarItem className="ml-2 flex gap-2">
          {session?.user ? (
            <>
              {/* Profile Dropdown */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Button isIconOnly variant="light" radius="full">
                    <Icon icon="octicon:person-24" width={20} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold">{session.user.email}</p>
                  </DropdownItem>
                  <DropdownItem
                    key="dashboard"
                    onPress={() => router.push("/dashboard")}
                    startContent={<Icon icon="solar:home-2-linear" />}
                  >
                    Dashboard
                  </DropdownItem>
                  <DropdownItem
                    key="orders"
                    onPress={() => router.push("/dashboard/orders")}
                    startContent={<Icon icon="solar:bag-4-linear" />}
                  >
                    My Orders
                  </DropdownItem>
                  <DropdownItem
                    key="settings"
                    onPress={() => router.push("/dashboard/settings")}
                    startContent={<Icon icon="solar:settings-linear" />}
                  >
                    Settings
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    onPress={async () => {
                      await authClient.signOut();
                      router.push("/");
                    }}
                    startContent={<Icon icon="solar:logout-2-linear" />}
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              {/* Wishlist */}
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <Button isIconOnly variant="light" radius="full">
                    <Icon icon="octicon:heart-24" width={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  {wishlistCount === 0 ? (
                    <div className="text-center py-8">
                      <Icon
                        icon="solar:heart-linear"
                        className="w-10 h-10 mx-auto text-default-200 mb-3"
                      />
                      <p className="text-default-400 text-xs">No saved items</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[360px] overflow-y-auto">
                        {wishlistItems.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="group hover:bg-default-50 transition-all"
                          >
                            <div className="flex items-center gap-2 px-3 py-2">
                              <div
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() =>
                                  router.push(`/products/${item.id}`)
                                }
                              >
                                <HeroImage
                                  src={item.image}
                                  alt={item.title}
                                  width={48}
                                  height={48}
                                  className="rounded-md object-cover"
                                />
                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-xs truncate">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-default-400 truncate">
                                      {item.description ||
                                        "Premium football gear"}
                                    </p>
                                  </div>
                                  <p className="text-xs ml-2 flex-shrink-0">
                                    ${item.price}
                                  </p>
                                </div>
                              </div>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                radius="full"
                                className="opacity-0 group-hover:opacity-100 transition-opacity min-w-unit-6 w-6 h-6"
                                onPress={() => {
                                  // Remove from wishlist
                                }}
                              >
                                <Icon icon="tabler:x" width={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Divider />
                      <div className="p-2">
                        <Button
                          fullWidth
                          variant="light"
                          size="sm"
                          className="h-8 text-xs"
                          onPress={() => router.push("/dashboard/wishlist")}
                        >
                          View All Saved Items
                        </Button>
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>

              {/* Shopping Bag */}
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <Button isIconOnly variant="light" radius="full">
                    <Icon icon="ion:bag-outline" width={22} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  {cartCount === 0 ? (
                    <div className="text-center py-8">
                      <Icon
                        icon="solar:bag-4-linear"
                        className="w-10 h-10 mx-auto text-default-200 mb-3"
                      />
                      <p className="text-default-400 text-xs">
                        Your bag is empty
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[280px] overflow-y-auto">
                        {session?.user
                          ? cartData?.items.slice(0, 4).map((item: any) => (
                              <div
                                key={item.id}
                                className="group hover:bg-default-50 transition-all"
                              >
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <div
                                    className="flex gap-2 flex-1 cursor-pointer"
                                    onClick={() =>
                                      router.push(`/products/${item.product.id}`)
                                    }
                                  >
                                    <HeroImage
                                      src={
                                        item.product.images?.[0] ||
                                        "/placeholder-product.jpg"
                                      }
                                      alt={item.product.title}
                                      width={48}
                                      height={48}
                                      className="rounded-md object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs truncate">
                                        {item.product.title}
                                      </p>
                                      <p className="text-xs text-default-400 truncate">
                                        $
                                        {Number(
                                          item.variant?.price || item.product.price,
                                        ).toFixed(2)}{" "}
                                        • Qty: {item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    radius="full"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity min-w-unit-6 w-6 h-6"
                                    onPress={() => {
                                      // Remove from cart
                                    }}
                                  >
                                    <Icon icon="tabler:x" width={14} />
                                  </Button>
                                </div>
                              </div>
                            ))
                          : guestCart
                              .getCartData()
                              .items.slice(0, 4)
                              .map((item) => (
                                <div
                                  key={`${item.productId}-${item.variantId || "default"}`}
                                  className="group hover:bg-default-50 transition-all"
                                >
                                  <div className="flex items-center gap-2 px-3 py-2">
                                    <div
                                      className="flex gap-2 flex-1 cursor-pointer"
                                      onClick={() =>
                                        router.push(`/products/${item.product.id}`)
                                      }
                                    >
                                      <HeroImage
                                        src={
                                          item.product.images?.[0] ||
                                          "/placeholder-product.jpg"
                                        }
                                        alt={item.product.title}
                                        width={48}
                                        height={48}
                                        className="rounded-md object-cover flex-shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">
                                          {item.product.title}
                                        </p>
                                        <p className="text-xs text-default-400 truncate">
                                          $
                                          {Number(
                                            item.variant?.price || item.product.price,
                                          ).toFixed(2)}{" "}
                                          • Qty: {item.quantity}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      radius="full"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity min-w-unit-6 w-6 h-6"
                                      onPress={() => {
                                        guestCart.removeItem(
                                          item.productId,
                                          item.variantId
                                        );
                                      }}
                                    >
                                      <Icon icon="tabler:x" width={14} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                      </div>
                      <Divider />
                      <div className="px-3 py-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-default-500">
                            Subtotal
                          </span>
                          <span className="text-sm font-medium">
                            $
                            {(session?.user
                              ? cartData?.subtotal
                              : guestCart.getCartData().subtotal
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 p-2 pt-0">
                        <Button
                          fullWidth
                          variant="light"
                          size="sm"
                          className="h-8 text-xs"
                          onPress={() => router.push("/bag")}
                        >
                          View Bag
                        </Button>
                        <Button
                          fullWidth
                          color="primary"
                          size="sm"
                          className="h-8 text-xs"
                          onPress={() => router.push("/checkout")}
                        >
                          Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <>
              {/* Shopping Bag for guests */}
              <Popover placement="bottom-end">
                <PopoverTrigger>
                  <Button isIconOnly variant="light" radius="full">
                    <Icon icon="ion:bag-outline" width={22} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0">
                  {cartCount === 0 ? (
                    <div className="text-center py-8">
                      <Icon
                        icon="solar:bag-4-linear"
                        className="w-10 h-10 mx-auto text-default-200 mb-3"
                      />
                      <p className="text-default-400 text-xs">
                        Your bag is empty
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[280px] overflow-y-auto">
                        {guestCart
                          .getCartData()
                          .items.slice(0, 4)
                          .map((item) => (
                            <div
                              key={`${item.productId}-${item.variantId || "default"}`}
                              className="group hover:bg-default-50 transition-all"
                            >
                              <div className="flex items-center gap-2 px-3 py-2">
                                <div
                                  className="flex gap-2 flex-1 cursor-pointer"
                                  onClick={() =>
                                    router.push(`/products/${item.product.id}`)
                                  }
                                >
                                  <HeroImage
                                    src={
                                      item.product.images?.[0] ||
                                      "/placeholder-product.jpg"
                                    }
                                    alt={item.product.title}
                                    width={48}
                                    height={48}
                                    className="rounded-md object-cover flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs truncate">
                                      {item.product.title}
                                    </p>
                                    <p className="text-xs text-default-400 truncate">
                                      $
                                      {Number(
                                        item.variant?.price || item.product.price,
                                      ).toFixed(2)}{" "}
                                      • Qty: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  radius="full"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity min-w-unit-6 w-6 h-6"
                                  onPress={() => {
                                    guestCart.removeItem(
                                      item.productId,
                                      item.variantId
                                    );
                                  }}
                                >
                                  <Icon icon="tabler:x" width={14} />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                      <Divider />
                      <div className="px-3 py-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-default-500">
                            Subtotal
                          </span>
                          <span className="text-sm font-medium">
                            ${guestCart.getCartData().subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 p-2 pt-0">
                        <Button
                          fullWidth
                          variant="light"
                          size="sm"
                          className="h-8 text-xs"
                          onPress={() => router.push("/bag")}
                        >
                          View Bag
                        </Button>
                        <Button
                          fullWidth
                          color="primary"
                          size="sm"
                          className="h-8 text-xs"
                          onPress={() => router.push("/checkout")}
                        >
                          Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>
              <Button as={Link} href="/auth/login" variant="light" size="sm">
                Sign In
              </Button>
              <Button as={Link} href="/auth/signup" color="primary" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarMenuToggle className="text-default-400 md:hidden" />

      <NavbarMenu className="bg-default-200/50 shadow-medium dark:bg-default-100/50 top-[calc(var(--navbar-height)-1px)] max-h-fit pt-6 pb-6 backdrop-blur-lg backdrop-saturate-150">
        {session?.user && (
          <>
            <NavbarMenuItem>
              <Button
                fullWidth
                variant="flat"
                startContent={<Icon icon="octicon:person-24" width={20} />}
                onPress={() => {
                  router.push("/dashboard");
                  setIsMenuOpen(false);
                }}
              >
                Profile
              </Button>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Button
                fullWidth
                variant="flat"
                startContent={<Icon icon="ion:bag-outline" width={20} />}
                onPress={() => {
                  router.push("/bag");
                  setIsMenuOpen(false);
                }}
              >
                Bag {cartCount > 0 && `(${cartCount})`}
              </Button>
            </NavbarMenuItem>
            <NavbarMenuItem className="mb-4">
              <Button
                fullWidth
                variant="flat"
                startContent={<Icon icon="octicon:heart-24" width={20} />}
                onPress={() => {
                  router.push("/dashboard/wishlist");
                  setIsMenuOpen(false);
                }}
              >
                Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Button>
            </NavbarMenuItem>
            <Divider className="opacity-50 mb-4" />
          </>
        )}
        {!session?.user && (
          <>
            <NavbarMenuItem>
              <Button
                fullWidth
                variant="flat"
                startContent={<Icon icon="ion:bag-outline" width={20} />}
                onPress={() => {
                  router.push("/bag");
                  setIsMenuOpen(false);
                }}
              >
                Bag {cartCount > 0 && `(${cartCount})`}
              </Button>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Button fullWidth as={Link} href="/auth/login" variant="faded">
                Sign In
              </Button>
            </NavbarMenuItem>
            <NavbarMenuItem className="mb-4">
              <Button
                fullWidth
                as={Link}
                className="bg-foreground text-background"
                href="/auth/login#signup"
              >
                Get Started
              </Button>
            </NavbarMenuItem>
          </>
        )}
        {siteConfig.navItems.map((item, index) => (
          <NavbarMenuItem key={`${item.label}-${index}`}>
            <Link
              className="text-default-500 mb-2 w-full uppercase text-sm tracking-wide"
              href={item.href}
            >
              {item.label}
            </Link>
            {index < siteConfig.navItems.length - 1 && (
              <Divider className="opacity-50" />
            )}
          </NavbarMenuItem>
        ))}
        {session?.user && (
          <>
            <Divider className="opacity-50 mt-4 mb-4" />
            <NavbarMenuItem>
              <Button
                fullWidth
                color="danger"
                variant="flat"
                startContent={<Icon icon="solar:logout-2-linear" />}
                onPress={async () => {
                  await authClient.signOut();
                  router.push("/");
                  setIsMenuOpen(false);
                }}
              >
                Log Out
              </Button>
            </NavbarMenuItem>
          </>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
