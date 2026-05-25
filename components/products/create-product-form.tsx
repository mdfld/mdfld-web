"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Sparkles,
  Package,
  DollarSign,
  Tag,
  ChevronRight,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Switch,
  Divider,
} from "@heroui/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/lib/constants/product-categories";
import { trpc } from "@/lib/trpc-client";
import { ProductVariantManagerNextUI } from "./product-variant-manager-nextui";
import { useDropzone } from "react-dropzone";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Please select a category"),
  brand: z.string().min(1, "Brand is required"),
  playerVersion: z
    .enum(["STANDARD", "PLAYER", "MATCH_ISSUED", "MATCH_WORN"])
    .optional(),
  tier: z.enum(["AUTHENTIC", "REPLICA"]).optional(),
  solelateType: z
    .enum(["FG", "SG_PRO", "AG", "TF", "IC", "SG", "MG"])
    .optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  hasVariants: z.boolean(),
  condition: z.enum([
    "NEW_WITH_BOX",
    "NEW_NO_BOX",
    "USED_LIKE_NEW",
    "USED_GOOD",
    "USED_FAIR",
  ]),
});

type ProductFormData = z.infer<typeof productSchema>;

interface CreateProductFormProps {
  sellerProfileId: string;
  organizationId?: string;
  onSuccess?: () => void;
}

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
};

const conditionOptions = [
  { value: "NEW_WITH_BOX", label: "New with Box", color: "success" },
  { value: "NEW_NO_BOX", label: "New without Box", color: "success" },
  { value: "USED_LIKE_NEW", label: "Used - Like New", color: "primary" },
  { value: "USED_GOOD", label: "Used - Good", color: "warning" },
  { value: "USED_FAIR", label: "Used - Fair", color: "danger" },
];

const playerVersionOptions = [
  {
    value: "STANDARD",
    label: "Standard",
    description: "Regular retail version",
  },
  {
    value: "PLAYER",
    label: "Player Version",
    description: "Professional player spec",
  },
  {
    value: "MATCH_ISSUED",
    label: "Match Issued",
    description: "Issued for a match",
  },
  {
    value: "MATCH_WORN",
    label: "Match Worn",
    description: "Worn in an actual match",
  },
];

const tierOptions = [
  { value: "AUTHENTIC", label: "Authentic", icon: "⭐" },
  { value: "REPLICA", label: "Replica", icon: "👕" },
];

const soleplateOptions = [
  { value: "FG", label: "Firm Ground (FG)", description: "Natural grass" },
  {
    value: "SG_PRO",
    label: "Soft Ground Pro (SG-PRO)",
    description: "Wet natural grass",
  },
  {
    value: "AG",
    label: "Artificial Ground (AG)",
    description: "Artificial turf",
  },
  { value: "TF", label: "Turf (TF)", description: "Short turf/hard ground" },
  { value: "IC", label: "Indoor Court (IC)", description: "Indoor surfaces" },
  { value: "SG", label: "Soft Ground (SG)", description: "Soft/wet grass" },
  { value: "MG", label: "Multi Ground (MG)", description: "Multiple surfaces" },
];

export default function CreateProductForm({
  sellerProfileId,
  organizationId,
  onSuccess,
}: CreateProductFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);

  // Weight
  const [weightValue, setWeightValue] = useState("");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  // Dimensions
  const [dimLength, setDimLength] = useState("");
  const [dimWidth, setDimWidth] = useState("");
  const [dimHeight, setDimHeight] = useState("");
  const [dimUnit, setDimUnit] = useState<"cm" | "in">("cm");

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema as any),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      brand: "",
      hasVariants: false,
      condition: "NEW_WITH_BOX",
      images: [],
    },
    mode: "onChange",
  });

  const selectedCategory = watch("category");
  const hasVariants = watch("hasVariants");

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const newImage = reader.result as string;
          setUploadedImages((prev) => [...prev, newImage]);
          setValue("images", [...uploadedImages, newImage]);
        };
        reader.readAsDataURL(file);
      });
    },
    [uploadedImages, setValue],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": ACCEPTED_IMAGE_TYPES,
    },
    maxSize: MAX_FILE_SIZE,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
  });

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setValue("images", newImages);
  };

  const onSubmit = async (data: ProductFormData) => {
    // Unit conversion — always store kg and cm
    const weightKg = weightValue
      ? weightUnit === "lbs"
        ? parseFloat(weightValue) * 0.453592
        : parseFloat(weightValue)
      : undefined;

    const toCm = (v: string) =>
      v ? (dimUnit === "in" ? parseFloat(v) * 2.54 : parseFloat(v)) : undefined;

    const dimensions =
      dimLength || dimWidth || dimHeight
        ? { length: toCm(dimLength), width: toCm(dimWidth), height: toCm(dimHeight) }
        : undefined;

    // Auto-tag REPS for replica jerseys
    const tags: string[] = [];
    if (data.category === "JERSEYS" && data.tier === "REPLICA") {
      tags.push("REPS");
    }

    const submitData = {
      sellerProfileId: sellerProfileId,
      organizationId: organizationId,
      title: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      brand: data.brand,
      inventory: hasVariants ? 0 : 100,
      images: uploadedImages,
      tags,
      hasVariants: data.hasVariants,
      condition: data.condition,
      playerVersion: data.playerVersion,
      tier: data.tier,
      soleplateType: data.solelateType,
      variants: hasVariants ? variants : undefined,
      weight: weightKg,
      dimensions,
    };
    await createProduct.mutateAsync(submitData as any);
  };

  const steps = [
    {
      id: "basics",
      label: "Product Details",
      icon: Package,
      description: "Basic information",
    },
    {
      id: "media",
      label: "Images",
      icon: ImageIcon,
      description: "Product photos",
    },
    {
      id: "pricing",
      label: "Pricing & Variants",
      icon: DollarSign,
      description: "Set your prices",
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          watch("name") &&
          watch("brand") &&
          watch("category") &&
          watch("description")
        );
      case 1:
        return uploadedImages.length > 0;
      case 2:
        return watch("price") > 0;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Create New Product</h2>
                <p className="text-default-500 mt-1">
                  Step {currentStep + 1} of {steps.length}:{" "}
                  {currentStepData.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-default-500">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
              </div>
            </div>

            <Progress
              value={progress}
              className="h-2"
              color="primary"
              aria-label="Form progress"
            />

            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === index;
                const isCompleted = currentStep > index;

                return (
                  <Button
                    key={step.id}
                    size="sm"
                    variant={isActive ? "flat" : "light"}
                    color={
                      isActive ? "primary" : isCompleted ? "success" : "default"
                    }
                    className="flex-col h-auto py-2 px-4"
                    onPress={() => isCompleted && setCurrentStep(index)}
                    isDisabled={!isCompleted && !isActive}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{step.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* Step 1: Product Details */}
          {currentStep === 0 && (
            <motion.div key="basics" {...fadeIn}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Product Information
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      {...register("name")}
                      label="Product Name"
                      placeholder="e.g., Nike Mercurial Vapor 15 Elite"
                      variant="bordered"
                      isRequired
                      errorMessage={errors.name?.message}
                      isInvalid={!!errors.name}
                      startContent={
                        <Tag className="h-4 w-4 text-default-400" />
                      }
                    />

                    <Input
                      {...register("brand")}
                      label="Brand"
                      placeholder="e.g., Nike, Adidas, Puma"
                      variant="bordered"
                      isRequired
                      errorMessage={errors.brand?.message}
                      isInvalid={!!errors.brand}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }: any) => (
                        <Select
                          {...field}
                          label="Category"
                          placeholder="Select a category"
                          variant="bordered"
                          isRequired
                          errorMessage={errors.category?.message}
                          isInvalid={!!errors.category}
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0];
                            field.onChange(selected);
                          }}
                        >
                          {Object.entries(PRODUCT_CATEGORIES).map(
                            ([key, value]) => (
                              <SelectItem key={key}>{value}</SelectItem>
                            ),
                          )}
                        </Select>
                      )}
                    />

                    <Controller
                      name="condition"
                      control={control}
                      render={({ field }: any) => (
                        <Select
                          {...field}
                          label="Condition"
                          placeholder="Select condition"
                          variant="bordered"
                          isRequired
                          selectedKeys={field.value ? [field.value] : []}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0];
                            field.onChange(selected);
                          }}
                          renderValue={(items: any) => {
                            const selected = items[0];
                            const option = conditionOptions.find(
                              (o) => o.value === selected.key,
                            );
                            return (
                              <div className="flex items-center gap-2">
                                <Chip
                                  size="sm"
                                  color={option?.color as any}
                                  variant="flat"
                                >
                                  {option?.label}
                                </Chip>
                              </div>
                            );
                          }}
                        >
                          {conditionOptions.map((option) => (
                            <SelectItem key={option.value}>
                              <div className="flex items-center gap-2">
                                <Chip
                                  size="sm"
                                  color={option.color as any}
                                  variant="flat"
                                >
                                  {option.label}
                                </Chip>
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                  </div>

                  <Textarea
                    {...register("description")}
                    label="Description"
                    placeholder="e.g. Size M, navy blue Arsenal home kit from the 2023/24 season. Worn twice, no stains or damage. Includes original tags."
                    variant="bordered"
                    isRequired
                    minRows={4}
                    errorMessage={errors.description?.message}
                    isInvalid={!!errors.description}
                    description="Include size, color, team/season, and any notable condition details."
                  />

                  {/* Weight */}
                  <div className="flex gap-3 items-end">
                    <Input
                      label="Weight"
                      placeholder="e.g. 0.8"
                      variant="bordered"
                      type="number"
                      min="0"
                      step="0.01"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                      className="flex-1"
                      description="Helps calculate shipping costs."
                    />
                    <div className="flex border border-default-300 rounded-lg overflow-hidden mb-[22px]">
                      {(["kg", "lbs"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setWeightUnit(u)}
                          className={cn(
                            "px-3 py-2 text-sm font-medium transition-colors",
                            weightUnit === u
                              ? "bg-primary text-white"
                              : "bg-default-100 text-default-600 hover:bg-default-200",
                          )}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-default-700">Package Dimensions</p>
                        <div className="group relative">
                          <Info className="h-3.5 w-3.5 text-default-400 cursor-help" />
                          <div className="absolute left-5 top-0 z-10 hidden group-hover:block w-56 bg-default-900 text-white text-xs rounded-lg p-2 shadow-lg">
                            Enter the dimensions of the <strong>shipping package</strong>, not the product itself. Carriers use this to calculate volumetric weight.
                          </div>
                        </div>
                      </div>
                      <div className="flex border border-default-300 rounded-lg overflow-hidden">
                        {(["cm", "in"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setDimUnit(u)}
                            className={cn(
                              "px-3 py-1.5 text-xs font-medium transition-colors",
                              dimUnit === u
                                ? "bg-primary text-white"
                                : "bg-default-100 text-default-600 hover:bg-default-200",
                            )}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: `Length (${dimUnit})`, value: dimLength, set: setDimLength },
                        { label: `Width (${dimUnit})`, value: dimWidth, set: setDimWidth },
                        { label: `Height (${dimUnit})`, value: dimHeight, set: setDimHeight },
                      ].map(({ label, value, set }) => (
                        <Input
                          key={label}
                          label={label}
                          placeholder="0"
                          variant="bordered"
                          type="number"
                          min="0"
                          step="0.1"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Category-specific fields */}
                  <AnimatePresence mode="wait">
                    {selectedCategory === "JERSEYS" && (
                      <motion.div
                        {...fadeIn}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        <Controller
                          name="playerVersion"
                          control={control}
                          render={({ field }: any) => (
                            <Select
                              {...field}
                              label="Player Version"
                              placeholder="Select version"
                              variant="bordered"
                              description="Type of jersey version"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0];
                                field.onChange(selected);
                              }}
                            >
                              {playerVersionOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  description={option.description}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />

                        <Controller
                          name="tier"
                          control={control}
                          render={({ field }: any) => (
                            <div className="flex flex-col gap-1">
                              <Select
                                {...field}
                                label="Tier"
                                placeholder="Select tier"
                                variant="bordered"
                                selectedKeys={field.value ? [field.value] : []}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0];
                                  field.onChange(selected);
                                }}
                              >
                                {tierOptions.map((option) => (
                                  <SelectItem key={option.value}>
                                    <div className="flex items-center gap-2">
                                      <span>{option.icon}</span>
                                      <span>{option.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </Select>
                              {field.value === "REPLICA" && (
                                <p className="text-xs text-warning-500 flex items-center gap-1 mt-1">
                                  <Info className="h-3 w-3 flex-shrink-0" />
                                  This jersey will be tagged as <strong>REPS</strong> in search results.
                                </p>
                              )}
                            </div>
                          )}
                        />
                      </motion.div>
                    )}

                    {selectedCategory === "CLEATS" && (
                      <motion.div {...fadeIn}>
                        <Controller
                          name="solelateType"
                          control={control}
                          render={({ field }: any) => (
                            <Select
                              {...field}
                              label="Soleplate Type"
                              placeholder="Select soleplate"
                              variant="bordered"
                              description="Choose the appropriate soleplate for the surface"
                              selectedKeys={field.value ? [field.value] : []}
                              onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0];
                                field.onChange(selected);
                              }}
                            >
                              {soleplateOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  description={option.description}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Images */}
          {currentStep === 1 && (
            <motion.div key="media" {...fadeIn}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Product Images</h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-6">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      isDragging && "border-primary bg-primary/10",
                      errors.images && "border-danger",
                    )}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-16 w-16 mx-auto mb-6 text-default-400" />
                    <p className="text-xl font-semibold mb-2">
                      Drop images here or click to upload
                    </p>
                    <p className="text-default-500">
                      PNG, JPG, WEBP up to 5MB • Multiple files supported
                    </p>
                    {errors.images && (
                      <p className="text-danger text-sm mt-2">
                        {errors.images.message}
                      </p>
                    )}
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {uploadedImages.length} images uploaded
                        </p>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => {
                            setUploadedImages([]);
                            setValue("images", []);
                          }}
                        >
                          Remove All
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {uploadedImages.map((image, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                          >
                            <Card className="p-2">
                              <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="solid"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => removeImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {index === 0 && (
                                <Chip
                                  size="sm"
                                  color="primary"
                                  className="absolute bottom-1 left-1"
                                >
                                  Main
                                </Chip>
                              )}
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Pricing & Variants */}
          {currentStep === 2 && (
            <motion.div key="pricing" {...fadeIn}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      Pricing & Inventory
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }: any) => (
                        <Input
                          type="number"
                          step="0.01"
                          label="Base Price"
                          placeholder="0.00"
                          variant="bordered"
                          isRequired
                          startContent={
                            <div className="pointer-events-none flex items-center">
                              <span className="text-default-400 text-small">
                                $
                              </span>
                            </div>
                          }
                          value={field.value.toString()}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          errorMessage={errors.price?.message}
                          isInvalid={!!errors.price}
                        />
                      )}
                    />

                    <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                      <div>
                        <p className="font-medium">Enable Size Variants</p>
                        <p className="text-sm text-default-500">
                          Manage different sizes and stock
                        </p>
                      </div>
                      <Controller
                        name="hasVariants"
                        control={control}
                        render={({ field }: any) => (
                          <Switch
                            isSelected={field.value}
                            onValueChange={field.onChange}
                            size="lg"
                            color="primary"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {hasVariants && (
                      <motion.div {...fadeIn}>
                        <Divider className="my-6" />
                        <ProductVariantManagerNextUI
                          basePrice={watch("price")}
                          category={selectedCategory}
                          onChange={setVariants}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="flat"
            onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
            isDisabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <p className="text-sm text-default-500">
              {currentStep < steps.length - 1
                ? "Ready to continue?"
                : "Ready to create?"}
            </p>

            {currentStep < steps.length - 1 ? (
              <Button
                color="primary"
                variant="flat"
                endContent={<ChevronRight className="h-4 w-4" />}
                onPress={() => setCurrentStep(currentStep + 1)}
                isDisabled={!canProceed()}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                color="primary"
                isLoading={createProduct.isPending}
                startContent={
                  !createProduct.isPending && <Sparkles className="h-4 w-4" />
                }
                isDisabled={!isValid}
              >
                Create Product
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
