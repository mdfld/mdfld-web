"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  Chip,
  Divider,
  Image,
  Link,
  RadioGroup,
  ScrollShadow,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { useAuth } from "@/hooks/use-auth";
import { useGuestCart } from "@/hooks/use-guest-cart";

import ColorRadioItem from "./color-radio-item";
import StarRatingDisplay from "./star-rating-display";
import TagGroupRadioItem from "./tag-group-radio-item";

export type ProductViewItemColor = {
  name: string;
  hex: string;
};

export type ProductViewItem = {
  id: string;
  name: string;
  description?: string;
  images: string[];
  price: number;
  rating?: number;
  ratingCount?: number;
  sizes?: string[];
  isPopular?: boolean;
  details?: {
    title: string;
    items: string[];
  }[];
  availableColors?: ProductViewItemColor[];
  hasVariants?: boolean;
  variants?: any[];
  seller?: {
    storeName: string;
    organization?: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
    } | null;
  };
};

export type ProductViewInfoProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id"
> & {
  isPopular?: boolean;
  isLoading?: boolean;
  removeWrapper?: boolean;
} & ProductViewItem;

const ProductViewInfo = React.forwardRef<HTMLDivElement, ProductViewInfoProps>(
  (
    {
      name,
      images,
      price,
      sizes,
      details,
      description,
      availableColors,
      rating,
      ratingCount,
      isPopular,
      className,
      hasVariants,
      variants,
      seller,
      ...props
    },
    ref,
  ) => {
    const router = useRouter();
    const { user } = useAuth();
    const utils = trpc.useUtils();
    const guestCart = useGuestCart();
    const [selectedImage, setSelectedImage] = React.useState(images[0]);
    const [selectedSize, setSelectedSize] = React.useState(sizes?.[0] || "");
    const [selectedColor, setSelectedColor] = React.useState(
      availableColors?.[0]?.hex || "",
    );
    const [isDescriptionExpanded, setIsDescriptionExpanded] =
      React.useState(false);
    const [isAddingToCart, setIsAddingToCart] = React.useState(false);

    // Get wishlist data
    const { data: wishlistProducts } = trpc.user.getWishlist.useQuery(
      undefined,
      { enabled: !!user },
    );

    // Check if this product is in the wishlist
    const isWishlisted = React.useMemo(() => {
      return wishlistProducts?.some((p: any) => p.id === props.id) || false;
    }, [wishlistProducts, props.id]);

    // Add to wishlist mutation
    const addToWishlist = trpc.user.addToWishlist.useMutation({
      onSuccess: () => {
        toast.success("Added to wishlist");
        utils.user.getWishlist.invalidate();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add to wishlist");
      },
    });

    // Remove from wishlist mutation
    const removeFromWishlist = trpc.user.removeFromWishlist.useMutation({
      onSuccess: () => {
        toast.success("Removed from wishlist");
        utils.user.getWishlist.invalidate();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to remove from wishlist");
      },
    });

    // Add to cart mutation
    const addToCart = trpc.cart.addItem.useMutation({
      onSuccess: () => {
        toast.success("Added to bag");
        utils.cart.get.invalidate();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to add to bag");
      },
    });

    const handleWishlistToggle = () => {
      if (!user) {
        toast.error("Please log in to save items");
        router.push("/auth/login");
        return;
      }

      if (isWishlisted) {
        removeFromWishlist.mutate({ productId: props.id });
      } else {
        addToWishlist.mutate({ productId: props.id });
      }
    };

    const handleAddToBag = () => {
      // Find the selected variant if product has variants
      const variant = hasVariants
        ? variants?.find((v: any) => {
            const colorMatch = !selectedColor || v.color === selectedColor;
            const sizeMatch = !selectedSize || v.size === selectedSize;
            return colorMatch && sizeMatch;
          })
        : null;

      if (user) {
        // Add to authenticated cart
        addToCart.mutate({
          productId: props.id,
          variantId: variant?.id,
          quantity: 1,
        });
      } else {
        // Add to guest cart
        setIsAddingToCart(true);
        try {
          guestCart.addItem({
            productId: props.id,
            variantId: variant?.id,
            quantity: 1,
            product: {
              id: props.id,
              title: name,
              price: price.toString(),
              images: images,
            },
            variant: variant
              ? {
                  id: variant.id,
                  price: variant.price.toString(),
                  sizeDisplay: variant.sizeDisplay,
                  color: variant.color,
                }
              : undefined,
          });
          toast.success("Added to bag");
        } catch (error) {
          toast.error("Failed to add to bag");
        } finally {
          setIsAddingToCart(false);
        }
      }
    };

    // Calculate variant price based on selection
    const getVariantPrice = () => {
      if (!hasVariants || !variants) return price;

      const variant = variants.find((v: any) => {
        const sizeMatch = v.sizeDisplay === selectedSize || !selectedSize;
        const colorMatch = v.colorHex === selectedColor || !selectedColor;
        return sizeMatch && colorMatch;
      });

      return variant ? parseFloat(variant.price) : price;
    };

    const variantPrice = getVariantPrice();

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8",
          className,
        )}
        {...props}
      >
        {/* Product Gallery */}
        <div className="relative h-full w-full flex-none">
          {isPopular && (
            <Chip
              className="bg-background/60 text-foreground/90 shadow-medium dark:bg-default-100/50 absolute top-3 left-3 z-20 h-10 gap-1 pr-2 pl-3 backdrop-blur-md backdrop-saturate-150"
              size="lg"
              startContent={<Icon icon="solar:star-bold" />}
            >
              Popular
            </Chip>
          )}
          {/* Main Image */}
          <Image
            alt={name}
            className="h-full w-full"
            radius="lg"
            src={selectedImage}
          />
          {/* Image Gallery */}
          <ScrollShadow
            className="-mx-2 mt-4 -mb-4 flex w-full max-w-full gap-4 px-2 pt-2 pb-4"
            orientation="horizontal"
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                className="rounded-medium ring-offset-background data-[selected=true]:ring-focus relative h-24 w-24 flex-none cursor-pointer items-center justify-center transition-shadow data-[selected=true]:ring-2 data-[selected=true]:ring-offset-2 data-[selected=true]:outline-hidden"
                data-selected={image === selectedImage}
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  removeWrapper
                  alt={name}
                  classNames={{
                    img: "h-full w-full",
                  }}
                  radius="lg"
                  src={image}
                />
              </button>
            ))}
          </ScrollShadow>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <h2 className="sr-only">Product information</h2>

          {/* Store Link */}
          {seller && seller.organization && (
            <Link
              href={`/orgs/${seller.organization.slug}`}
              className="inline-flex items-center gap-2 text-default-600 hover:text-primary transition-colors mt-2"
            >
              {seller.organization.logo && (
                <Image
                  src={seller.organization.logo}
                  alt={seller.organization.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm font-medium">
                {seller.organization.name}
              </span>
              <Icon icon="solar:arrow-right-up-linear" width={14} />
            </Link>
          )}

          <div className="my-2 flex items-center gap-2">
            <StarRatingDisplay rating={rating || 0} size="sm" />
            <p className="text-small text-default-400">
              {ratingCount || 0} {ratingCount === 1 ? "review" : "reviews"}
            </p>
          </div>
          <p className="text-xl font-medium tracking-tight">
            ${variantPrice.toFixed(2)}
          </p>
          <div className="mt-4">
            <p className="sr-only">Product description</p>
            <div className="text-medium text-default-500">
              <p
                className={cn(
                  "transition-all duration-300",
                  !isDescriptionExpanded && "line-clamp-3",
                )}
              >
                {description}
              </p>
              {description && description.length > 150 && (
                <div className="flex items-center gap-2 mt-3">
                  <Divider className="flex-1" />
                  <button
                    className="text-primary hover:opacity-80 transition-opacity text-sm font-medium px-2"
                    onClick={() =>
                      setIsDescriptionExpanded(!isDescriptionExpanded)
                    }
                  >
                    {isDescriptionExpanded ? "View less" : "View more"}
                  </button>
                  <Divider className="flex-1" />
                </div>
              )}
            </div>
          </div>
          <RadioGroup
            aria-label="Color"
            classNames={{
              base: "ml-1 mt-6",
              wrapper: "gap-2",
            }}
            value={selectedColor}
            onValueChange={setSelectedColor}
            orientation="horizontal"
          >
            {availableColors?.map(({ name, hex }) => (
              <ColorRadioItem
                key={name}
                color={hex}
                tooltip={name}
                value={hex}
              />
            ))}
          </RadioGroup>
          <div className="mt-6 flex flex-col gap-1">
            <RadioGroup
              aria-label="Select size"
              className="gap-1"
              value={selectedSize}
              onValueChange={setSelectedSize}
              orientation="horizontal"
            >
              {sizes?.map((size) => (
                <TagGroupRadioItem key={size} size="lg" value={size}>
                  {size}
                </TagGroupRadioItem>
              ))}
            </RadioGroup>
            <Link
              isExternal
              className="text-default-400 my-2"
              href="#"
              size="sm"
            >
              See guide
              <Icon
                className="[&>path]:stroke-[2px]"
                icon="solar:arrow-right-up-linear"
              />
            </Link>
          </div>
          <Accordion
            className="-mx-1 mt-2"
            itemClasses={{
              title: "text-default-400",
              content: "pt-0 pb-6 text-base text-default-500",
            }}
            items={details}
            selectionMode="multiple"
          >
            {details
              ? details.map(({ title, items }) => (
                  <AccordionItem key={title} title={title}>
                    <ul className="list-inside list-disc">
                      {items.map((item) => (
                        <li key={item} className="text-default-500">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </AccordionItem>
                ))
              : []}
          </Accordion>
          <div className="mt-2 flex gap-2">
            <Button
              fullWidth
              className="text-medium font-medium"
              color="primary"
              size="lg"
              startContent={<Icon icon="solar:bag-4-bold" width={24} />}
              variant="solid"
              onPress={handleAddToBag}
              isLoading={addToCart.isPending || isAddingToCart}
              isDisabled={addToCart.isPending || isAddingToCart}
            >
              {addToCart.isPending || isAddingToCart ? "Adding..." : "Add to bag"}
            </Button>
            <Button
              isIconOnly
              className="text-default-600"
              size="lg"
              variant="flat"
              onPress={handleWishlistToggle}
              isLoading={
                addToWishlist.isPending || removeFromWishlist.isPending
              }
              isDisabled={
                addToWishlist.isPending || removeFromWishlist.isPending
              }
            >
              {addToWishlist.isPending || removeFromWishlist.isPending ? (
                <Icon
                  className="animate-spin"
                  icon="solar:refresh-linear"
                  width={24}
                />
              ) : isWishlisted ? (
                <Icon
                  className="text-danger"
                  icon="solar:heart-bold"
                  width={24}
                />
              ) : (
                <Icon icon="solar:heart-linear" width={24} />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

ProductViewInfo.displayName = "ProductViewInfo";

export default ProductViewInfo;
