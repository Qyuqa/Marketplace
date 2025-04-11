import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingCart, Store, Shield } from "lucide-react";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

// Registration schema
const registrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You must accept the terms and conditions",
    }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registrationSchema>;

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      isVendor: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Hero Section (Right on large screens) */}
      <div className="w-full lg:w-1/2 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 lg:p-16 flex flex-col justify-center order-1 lg:order-2">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold mb-6">
            Welcome to Qyuqa
          </h1>
          <p className="text-lg lg:text-xl mb-8 opacity-90">
            The premier multivendor marketplace with thousands of products from trusted vendors
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-full mr-4">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Shop with Confidence</h3>
                <p className="opacity-80">
                  Browse thousands of products from various vendors in one place
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-full mr-4">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Start Selling</h3>
                <p className="opacity-80">
                  Become a vendor and reach thousands of customers worldwide
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-white/10 p-2 rounded-full mr-4">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure Transactions</h3>
                <p className="opacity-80">
                  Shop with peace of mind with our secure payment processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form (Left on large screens) */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex items-center justify-center order-2 lg:order-1">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-6">
            <Tabs
              defaultValue="login"
              value={authMode}
              onValueChange={(value) => setAuthMode(value as "login" | "register")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <FormField
                        control={loginForm.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer">
                              Remember me
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <a
                        href="#"
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Forgot password?
                      </a>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => setAuthMode("register")}
                        >
                          Register
                        </button>
                      </p>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create a password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-2 mt-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">
                              I agree to the{" "}
                              <a
                                href="#"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a
                                href="#"
                                className="text-primary-600 hover:text-primary-700"
                              >
                                Privacy Policy
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="text-primary-600 hover:text-primary-700 font-medium"
                          onClick={() => setAuthMode("login")}
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
