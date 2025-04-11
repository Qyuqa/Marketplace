import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Schema for vendor registration
const vendorSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().optional(),
  logoUrl: z.string().url("Please enter a valid URL").optional(),
  bannerColor: z.string().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the terms and conditions",
    }),
  }),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function VendorRegister() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);

  // Form setup
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      storeName: "",
      description: "",
      contactEmail: user?.email || "",
      contactPhone: "",
      logoUrl: "",
      bannerColor: "from-blue-600 to-blue-400",
      termsAccepted: false,
    },
  });

  // Vendor registration mutation
  const vendorMutation = useMutation({
    mutationFn: async (data: VendorFormValues) => {
      const res = await apiRequest("POST", "/api/vendors", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Registration successful!",
        description: "Your vendor account has been created.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: VendorFormValues) => {
    if (step === 1) {
      setStep(2);
    } else {
      vendorMutation.mutate(data);
    }
  };

  // Banner color options
  const bannerColorOptions = [
    { value: "from-blue-600 to-blue-400", label: "Blue" },
    { value: "from-green-600 to-green-400", label: "Green" },
    { value: "from-purple-600 to-purple-400", label: "Purple" },
    { value: "from-pink-600 to-pink-400", label: "Pink" },
    { value: "from-indigo-600 to-indigo-400", label: "Indigo" },
    { value: "from-red-600 to-red-400", label: "Red" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a Vendor
          </h1>
          <p className="text-gray-600">
            Join our marketplace and start selling your products to millions of customers
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
          </div>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Store Information" : "Review & Submit"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Fill in the details about your store"
                : "Review your information before submitting"}
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {step === 1 ? (
                  /* Step 1: Store Information */
                  <>
                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Store Name" {...field} />
                          </FormControl>
                          <FormDescription>
                            This is the name that customers will see
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your store and products"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Tell customers what makes your store special
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@yourstore.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Phone (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="(555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/logo.png"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a URL for your store logo (recommended size: 200x200px)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bannerColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner Color</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bannerColorOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center">
                                    <div
                                      className={`h-4 w-4 rounded-full bg-gradient-to-r ${option.value} mr-2`}
                                    ></div>
                                    {option.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  /* Step 2: Review & Submit */
                  <>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium">Store Preview</h3>
                        <div className="mt-4 border rounded-lg overflow-hidden">
                          <div
                            className={`h-24 bg-gradient-to-r ${form.getValues(
                              "bannerColor"
                            )}`}
                          ></div>
                          <div className="p-4">
                            <div className="flex items-start -mt-12">
                              <div className="h-16 w-16 rounded-lg border-4 border-white bg-white overflow-hidden">
                                {form.getValues("logoUrl") ? (
                                  <img
                                    src={form.getValues("logoUrl")}
                                    alt="Store logo"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/64?text=${form.getValues("storeName").charAt(0)}`;
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-600 font-bold text-xl">
                                    {form.getValues("storeName").charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 pt-8">
                                <h3 className="font-bold text-lg">
                                  {form.getValues("storeName")}
                                </h3>
                              </div>
                            </div>
                            <div className="mt-4">
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {form.getValues("description")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500">
                            Store Name
                          </span>
                          <span className="text-gray-700">
                            {form.getValues("storeName")}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-500">
                            Contact Email
                          </span>
                          <span className="text-gray-700">
                            {form.getValues("contactEmail")}
                          </span>
                        </div>

                        {form.getValues("contactPhone") && (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">
                              Contact Phone
                            </span>
                            <span className="text-gray-700">
                              {form.getValues("contactPhone")}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-amber-800">
                            Important Information
                          </h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Your vendor account will need to be approved before you can start selling.
                            We'll review your application and get back to you within 1-2 business days.
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to the{" "}
                                <a
                                  href="#"
                                  className="text-primary-600 hover:underline"
                                >
                                  Vendor Terms
                                </a>{" "}
                                and{" "}
                                <a
                                  href="#"
                                  className="text-primary-600 hover:underline"
                                >
                                  Seller Policy
                                </a>
                              </FormLabel>
                              <FormDescription>
                                You must agree to our terms to create a vendor account
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex justify-between">
                {step === 1 ? (
                  <div className="flex w-full justify-end">
                    <Button type="submit">
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={vendorMutation.isPending}
                      className="gap-2"
                    >
                      {vendorMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Benefits Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Benefits of Being a Vendor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Access to Millions of Customers
              </h3>
              <p className="text-gray-600 text-sm">
                Reach a vast customer base that's already shopping on our platform
              </p>
            </div>

            <div className="flex flex-col">
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Easy Store Management
              </h3>
              <p className="text-gray-600 text-sm">
                Powerful tools to manage your inventory, orders, and customer relationships
              </p>
            </div>

            <div className="flex flex-col">
              <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Secure Payments
              </h3>
              <p className="text-gray-600 text-sm">
                Reliable payment processing with protection for both you and your customers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}
