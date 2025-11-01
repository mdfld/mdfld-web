"use client";

import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Link,
  Tab,
  Tabs,
  Tooltip,
  User,
  Spinner,
  Pagination,
} from "@heroui/react";

import { useSession } from "@/lib/auth-client";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ProductCard from "@/components/product-card";
import { useRouter } from "next/navigation";

interface OrganizationProfileProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    banner: string | null;
    description: string | null;
    website: string | null;
    industry: string | null;
    size: string | null;
    businessType: string;
    isVerified: boolean;
    trustScore: number;
    createdAt: Date;
    addressCity: string | null;
    addressState: string | null;
    addressCountry: string | null;
    members: Array<{
      user: {
        id: string;
        name: string;
        username: string;
        image: string | null;
      };
      role: string;
    }>;
    products: Array<any>;
    sellerProfile: {
      averageRating: number;
      totalSales: number;
      _count: {
        products: number;
        reviews: number;
      };
    } | null;
    _count: {
      products: number;
      orders: number;
      members: number;
    };
  };
}

export function OrganizationProfileContent({
  organization,
}: OrganizationProfileProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("products");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [products, setProducts] = useState(organization.products || []);
  const [productsPagination, setProductsPagination] = useState<{
    page: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  } | null>(null);
  const [productsPage, setProductsPage] = useState(1);

  const formatLocation = () => {
    const parts = [
      organization.addressCity,
      organization.addressState,
      organization.addressCountry,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location not specified";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const fetchProducts = async (page: number = 1) => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch(
        `/api/organizations/${organization.slug}/products?page=${page}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setProducts(data.products);
        } else {
          setProducts([...products, ...data.products]);
        }
        setProductsPagination(data.pagination);
        setProductsPage(page);
      }
    } catch (error) {
      // Error fetching products
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const isMember =
    session?.user &&
    (organization as any).members.some(
      (member: any) => member.user.id === session.user.id,
    );

  return (
    <>
      {/* Full Width Banner */}
      <div className="relative w-full h-80 md:h-96 lg:h-[28rem] -mt-8">
        {organization.banner ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${organization.banner})` }}
          >
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />
          </div>
        )}

        {/* Glassmorphic Organization Info Bar with Logo */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/50 border-white/20 overflow-visible shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
            <div className="container mx-auto px-4 max-w-6xl overflow-visible">
              <div className="flex items-start py-4 overflow-visible gap-8">
                {/* Logo - Now in same container with overlap */}
                <div className="relative -mt-12 shrink-0">
                  <Avatar
                    src={organization.logo || undefined}
                    name={organization.name}
                    className="w-32 h-32 border-2 border-primary shadow-2xl text-2xl"
                    radius="md"
                  />
                  {/* Verified Badge */}
                  {organization.isVerified && (
                    <div className="absolute -bottom-2 -right-2">
                      <div className="bg-success text-white rounded-full p-2">
                        <Icon icon="solar:verified-check-bold" width={20} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Organization Info */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col">
                    <h1 className="text-xl md:text-3xl font-normal tracking-widest capitalize text-white drop-shadow-lg">
                      {organization.name}
                    </h1>
                    <p className="text-white/80 text-sm drop-shadow">
                      A MDFLD Store
                    </p>
                  </div>
                  <div className="flex py-2 gap-4">
                    <div className="flex gap-2 items-center">
                      <Icon
                        icon="solar:box-minimalistic-outline"
                        className="text-white/90"
                      />
                      <Divider orientation="vertical" className="bg-white/30" />
                      <p className="text-sm text-white/90">
                        {organization._count.products} Products
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Icon
                        icon="solar:bag-smile-outline"
                        className="text-white/90"
                      />
                      <Divider orientation="vertical" className="bg-white/30" />
                      <p className="text-sm text-white/90">
                        {organization._count.orders} Orders
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Icon icon="codicon:location" className="text-white/90" />
                      <Divider orientation="vertical" className="bg-white/30" />
                      <p className="text-sm text-white/90">
                        {formatLocation()}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Icon
                        icon="solar:calendar-outline"
                        className="text-white/90"
                      />
                      <Divider orientation="vertical" className="bg-white/30" />
                      <p className="text-sm text-white/90">
                        Since {formatDate(organization.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className="hidden md:flex items-center gap-3 text-sm text-white/90">
                    {organization.website && (
                      <Button
                        as={Link}
                        href={organization.website}
                        target="_blank"
                        radius="full"
                        className="px-8 text-xs tracking-tight"
                        color="primary"
                        startContent={<Icon icon="solar:link-outline" />}
                      >
                        Website
                      </Button>
                    )}
                    {isMember && (
                      <>
                        <Divider
                          orientation="vertical"
                          className="bg-white/30 h-8 self-center"
                        />
                        <Button
                          radius="full"
                          className="px-8 text-xs tracking-tight"
                          color="default"
                          onClick={() =>
                            router.push("/dashboard/organization/settings")
                          }
                        >
                          Manage Store
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Description Bar */}
      {organization.description && (
        <div className="flex justify-center w-full backdrop-blur-lg bg-white/5 dark:bg-black/5 border-b border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <div className="flex justify-center px-4 max-w-6xl">
            <div className="py-6 flex items-center justify-center gap-4">
              <div className="flex-1 mx-34">
                <p className="text-default-600 text-center dark:text-default-400">
                  {organization.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="relative">
        <div className="flex flex-col w-full relative z-10">
          <Tabs
            aria-label="Store sections"
            classNames={{
              tabList:
                "gap-20 relative px-0 w-screen rounded-none p-0 border-b border-divider",
              cursor: "w-full",
              tab: "max-w-fit px-0 h-12",
              tabContent: "capitalize px-10 tracking-widest",
            }}
            color="primary"
            variant="underlined"
            selectedKey={selectedTab}
            onSelectionChange={(key) => {
              setSelectedTab(key as string);
              if (
                key === "products" &&
                products.length === 0 &&
                !isLoadingProducts
              ) {
                fetchProducts(1);
              }
            }}
          >
            <Tab key="products" title="Products">
              <div className="p-8">
                {isLoadingProducts && productsPage === 1 ? (
                  <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                  </div>
                ) : products.length === 0 ? (
                  <Card>
                    <CardBody className="p-16 text-center">
                      <Icon
                        icon="solar:box-outline"
                        width={64}
                        className="mx-auto text-default-300 mb-4"
                      />
                      <p className="text-default-600">
                        No products available yet
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {productsPagination &&
                      productsPagination.totalPages > 1 && (
                        <div className="flex justify-center mt-8">
                          <Pagination
                            total={productsPagination.totalPages}
                            page={productsPage}
                            onChange={(page) => fetchProducts(page)}
                            showControls
                            color="primary"
                            variant="bordered"
                          />
                        </div>
                      )}
                  </div>
                )}
              </div>
            </Tab>
            <Tab key="about" title="About">
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Description Card - Spans 2 columns on lg */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Description Section */}
                    <div className="relative">
                      <div className="absolute -left-8 top-0 bottom-0 w-1 bg-primary rounded-full" />
                      <h3 className="text-2xl font-light tracking-wide mb-6 text-default-900">
                        Our Story
                      </h3>
                      <p className="text-default-600 leading-relaxed text-lg">
                        {organization.description ||
                          "Crafting exceptional experiences and building lasting relationships through our dedication to quality and innovation."}
                      </p>
                    </div>

                    {/* Business Details Grid */}
                    <div className="grid grid-cols-2 gap-6 pt-8 border-t border-default-200">
                      <div className="space-y-6">
                        <div>
                          <p className="text-sm uppercase tracking-wider text-default-400 mb-2">
                            Business Type
                          </p>
                          <p className="text-lg text-default-700 capitalize">
                            {organization.businessType.replace(/_/g, " ")}
                          </p>
                        </div>
                        {organization.size && (
                          <div>
                            <p className="text-sm uppercase tracking-wider text-default-400 mb-2">
                              Company Size
                            </p>
                            <p className="text-lg text-default-700 capitalize">
                              {organization.size.replace(/_/g, " ")}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-6">
                        {organization.industry && (
                          <div>
                            <p className="text-sm uppercase tracking-wider text-default-400 mb-2">
                              Industry
                            </p>
                            <p className="text-lg text-default-700">
                              {organization.industry}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm uppercase tracking-wider text-default-400 mb-2">
                            Established
                          </p>
                          <p className="text-lg text-default-700">
                            {formatDate(organization.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Side Info Card */}
                  <div className="space-y-6">
                    {/* Location Card */}
                    <Card className="bg-transparent shadow-none border rounded-sm border-default-200">
                      <CardBody className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-full bg-primary/10">
                            <Icon
                              icon="solar:map-point-bold"
                              className="text-primary"
                              width={20}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm uppercase tracking-wider text-default-400 mb-2">
                              Headquarters
                            </p>
                            <p className="text-default-700 font-medium">
                              {formatLocation()}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Website Card */}
                    {organization.website && (
                      <Card className="bg-transparent shadow-none border border-default-200">
                        <CardBody className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-primary/10">
                              <Icon
                                icon="solar:global-bold"
                                className="text-primary"
                                width={20}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm uppercase tracking-wider text-default-400 mb-2">
                                Website
                              </p>
                              <Link
                                href={organization.website}
                                target="_blank"
                                className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                              >
                                Visit Website
                                <Icon
                                  icon="solar:arrow-right-up-linear"
                                  width={16}
                                />
                              </Link>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {/* Trust Badge */}
                    {organization.isVerified && (
                      <Card className="border-none bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardBody className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-primary/20">
                              <Icon
                                icon="solar:verified-check-bold"
                                className="text-primary"
                                width={24}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-default-900">
                                Verified Business
                              </p>
                              <p className="text-sm text-default-500">
                                Trusted by our community
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </Tab>
            <Tab key="team" title="Team">
              <div className="p-8">
                <Card>
                  <CardBody className="p-6">
                    <div className="flex flex-col gap-4">
                      {(organization as any).members.map((member: any) => (
                        <div
                          key={member.user.id}
                          className="flex items-center justify-between p-3 hover:bg-default-100 rounded-lg transition-colors"
                        >
                          <User
                            name={member.user.name}
                            description={`@${member.user.username}`}
                            avatarProps={{
                              src: member.user.image || undefined,
                              size: "md",
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <Chip color="primary" size="sm" variant="flat">
                              {member.role}
                            </Chip>
                            <Button
                              as={Link}
                              href={`/users/${member.user.username}`}
                              size="sm"
                              variant="light"
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
}
