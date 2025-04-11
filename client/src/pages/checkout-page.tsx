import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  CreditCard, 
  Check, 
  ShieldCheck, 
  ChevronRight, 
  Info 
} from "lucide-react";

// Schema for shipping address
const shippingSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(10, "Phone number is required"),
});

// Schema for payment
const paymentSchema = z.object({
  paymentMethod: z.enum(["creditCard", "paypal", "applePay"]),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  savePaymentInfo: z.boolean().optional(),
});

// Combined schema
const checkoutSchema = z.object({
  shipping: shippingSchema,
  payment: paymentSchema,
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cartData, isLoading: cartLoading } = useCart();

  // Initialize form with default values
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping: {
        fullName: user?.fullName || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        phone: "",
      },
      payment: {
        paymentMethod: "creditCard",
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
        savePaymentInfo: false,
      },
      notes: "",
    },
  });

  // Calculate order totals
  const calculateTotals = () => {
    if (!cartData || !cartData.items.length) {
      return { subtotal: 0, tax: 0, shipping: 0, total: 0 };
    }

    const subtotal = cartData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
    };
  };

  const { subtotal, tax, shipping, total } = calculateTotals();

  // Handle order submission
  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", {
        shippingAddress: data.shipping,
        paymentMethod: data.payment.paymentMethod,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your purchase.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const navigateToStep = (newStep: 'shipping' | 'payment' | 'review') => {
    if (newStep === 'payment' && step === 'shipping') {
      form.trigger('shipping').then((isValid) => {
        if (isValid) setStep(newStep);
      });
    } else if (newStep === 'review' && step === 'payment') {
      form.trigger('payment').then((isValid) => {
        if (isValid) setStep(newStep);
      });
    } else {
      setStep(newStep);
    }
  };

  const onSubmit = (data: CheckoutFormValues) => {
    if (step === 'shipping') {
      navigateToStep('payment');
    } else if (step === 'payment') {
      navigateToStep('review');
    } else {
      orderMutation.mutate(data);
    }
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
        <p className="text-lg text-gray-600">Preparing checkout...</p>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 mb-8">Complete your purchase by providing shipping and payment details.</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Shipping Information */}
                <Card className={step !== 'shipping' ? 'opacity-80' : ''}>
                  <CardHeader className="flex flex-row items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      <span className="font-bold">1</span>
                    </div>
                    <CardTitle>Shipping Information</CardTitle>
                    {step !== 'shipping' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => setStep('shipping')}
                      >
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  
                  {(step === 'shipping' || step === 'review') && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="shipping.fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shipping.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="shipping.addressLine1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shipping.addressLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apt 4B" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="shipping.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="New York" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shipping.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input placeholder="NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="shipping.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shipping.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}

                  {step === 'shipping' && (
                    <CardFooter>
                      <Button type="button" onClick={() => navigateToStep('payment')} className="ml-auto">
                        Continue to Payment <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>

                {/* Payment Information */}
                <Card className={step !== 'payment' ? 'opacity-80' : ''}>
                  <CardHeader className="flex flex-row items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      <span className="font-bold">2</span>
                    </div>
                    <CardTitle>Payment Method</CardTitle>
                    {step !== 'payment' && step === 'review' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => setStep('payment')}
                      >
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  
                  {(step === 'payment' || step === 'review') && (
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="payment.paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-3"
                              >
                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:border-primary-200 hover:bg-primary-50">
                                  <RadioGroupItem value="creditCard" id="creditCard" />
                                  <label htmlFor="creditCard" className="flex items-center justify-between w-full cursor-pointer">
                                    <div className="flex items-center">
                                      <CreditCard className="mr-3 h-5 w-5 text-primary-600" />
                                      <div>
                                        <p className="font-medium">Credit / Debit Card</p>
                                        <p className="text-sm text-gray-500">Pay securely with your card</p>
                                      </div>
                                    </div>
                                    <div className="flex space-x-1">
                                      <img src="https://cdn-icons-png.flaticon.com/128/196/196578.png" alt="Visa" className="h-6" />
                                      <img src="https://cdn-icons-png.flaticon.com/128/196/196561.png" alt="MasterCard" className="h-6" />
                                    </div>
                                  </label>
                                </div>

                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:border-primary-200 hover:bg-primary-50">
                                  <RadioGroupItem value="paypal" id="paypal" />
                                  <label htmlFor="paypal" className="flex items-center justify-between w-full cursor-pointer">
                                    <div className="flex items-center">
                                      <img src="https://cdn-icons-png.flaticon.com/128/196/196565.png" alt="PayPal" className="mr-3 h-6" />
                                      <div>
                                        <p className="font-medium">PayPal</p>
                                        <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                                      </div>
                                    </div>
                                  </label>
                                </div>

                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:border-primary-200 hover:bg-primary-50">
                                  <RadioGroupItem value="applePay" id="applePay" />
                                  <label htmlFor="applePay" className="flex items-center justify-between w-full cursor-pointer">
                                    <div className="flex items-center">
                                      <img src="https://cdn-icons-png.flaticon.com/128/5968/5968819.png" alt="Apple Pay" className="mr-3 h-6" />
                                      <div>
                                        <p className="font-medium">Apple Pay</p>
                                        <p className="text-sm text-gray-500">Pay with Apple Pay</p>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("payment.paymentMethod") === "creditCard" && (
                        <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-md">
                          <div className="grid grid-cols-1 gap-4">
                            <FormField
                              control={form.control}
                              name="payment.cardNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Card Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="1234 5678 9012 3456" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="payment.cardName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name on Card</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="payment.expiryDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date</FormLabel>
                                  <FormControl>
                                    <Input placeholder="MM/YY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="payment.cvv"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CVV</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                        All transactions are secure and encrypted
                      </div>
                    </CardContent>
                  )}

                  {step === 'payment' && (
                    <CardFooter className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep('shipping')}
                      >
                        Back
                      </Button>
                      <Button type="button" onClick={() => navigateToStep('review')}>
                        Review Order <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>

                {/* Order Review */}
                <Card className={step !== 'review' ? 'opacity-80' : ''}>
                  <CardHeader className="flex flex-row items-center">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-3">
                      <span className="font-bold">3</span>
                    </div>
                    <CardTitle>Review Order</CardTitle>
                  </CardHeader>
                  
                  {step === 'review' && (
                    <>
                      <CardContent className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Order Items ({cartData?.items.length})</h3>
                          <div className="space-y-4">
                            {cartData?.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border">
                                    <img
                                      src={item.product.imageUrl}
                                      alt={item.product.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            {shipping === 0 ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              <span>${shipping.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax</span>
                            <span>${tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-medium pt-2">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-medium mb-2">Shipping Address</h3>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p>{form.getValues("shipping.fullName")}</p>
                            <p>{form.getValues("shipping.addressLine1")}</p>
                            {form.getValues("shipping.addressLine2") && (
                              <p>{form.getValues("shipping.addressLine2")}</p>
                            )}
                            <p>
                              {form.getValues("shipping.city")}, {form.getValues("shipping.state")} {form.getValues("shipping.postalCode")}
                            </p>
                            <p>{form.getValues("shipping.country")}</p>
                            <p>{form.getValues("shipping.phone")}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-2">Payment Method</h3>
                          <div className="bg-gray-50 p-3 rounded-md">
                            {form.getValues("payment.paymentMethod") === "creditCard" && (
                              <div className="flex items-center">
                                <CreditCard className="mr-2 h-5 w-5 text-primary-600" />
                                <div>
                                  <p>Credit Card ending in {form.getValues("payment.cardNumber")?.slice(-4) || "****"}</p>
                                  <p className="text-sm text-gray-500">{form.getValues("payment.cardName")}</p>
                                </div>
                              </div>
                            )}
                            {form.getValues("payment.paymentMethod") === "paypal" && (
                              <div className="flex items-center">
                                <img src="https://cdn-icons-png.flaticon.com/128/196/196565.png" alt="PayPal" className="mr-2 h-6" />
                                <p>PayPal</p>
                              </div>
                            )}
                            {form.getValues("payment.paymentMethod") === "applePay" && (
                              <div className="flex items-center">
                                <img src="https://cdn-icons-png.flaticon.com/128/5968/5968819.png" alt="Apple Pay" className="mr-2 h-6" />
                                <p>Apple Pay</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Special instructions for delivery or any other comments" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>

                      <CardFooter className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setStep('payment')}
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={orderMutation.isPending}
                          className="gap-2"
                        >
                          {orderMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Place Order
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </>
                  )}
                </Card>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible defaultValue="items">
                    <AccordionItem value="items">
                      <AccordionTrigger>
                        Items ({cartData?.items.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 mt-2">
                          {cartData?.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <div>
                                <span>{item.product.name}</span>
                                <span className="text-gray-500 block">Qty: {item.quantity}</span>
                              </div>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>${shipping.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center bg-gray-50 p-3 rounded-md mt-4 text-sm text-gray-600">
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    <span>This is a demo checkout. No real payments will be processed.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
