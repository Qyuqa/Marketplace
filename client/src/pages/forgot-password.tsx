import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle, Info } from "lucide-react";

const forgotPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrUsername: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const response = await apiRequest("POST", "/api/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center text-green-600">
              <CheckCircle className="mr-2 h-6 w-6" />
              Check Your Email
            </CardTitle>
            <CardDescription>
              Password reset instructions have been sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert data-testid="alert-success">
              <Info className="h-4 w-4" />
              <AlertDescription>
                If an account exists with the email or username you provided, you will receive password reset instructions.
              </AlertDescription>
            </Alert>
            
            <Alert data-testid="alert-dev-note">
              <AlertDescription className="space-y-2">
                <p className="font-semibold">Development Environment Note:</p>
                <p className="text-sm">
                  In a production environment, the reset link would be sent to your email. 
                  For development purposes, check the server console logs for the reset link.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                If you have the reset token, you can enter it manually:
              </p>
              <Button
                onClick={() => navigate("/reset-password")}
                className="w-full"
                data-testid="button-enter-token"
              >
                Enter Reset Token
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate("/auth")}
                className="text-sm"
                data-testid="link-back-to-login"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email or username to receive password reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forgotPasswordMutation.isError && (
            <Alert variant="destructive" className="mb-4" data-testid="alert-error">
              <AlertDescription>
                {(forgotPasswordMutation.error as any)?.message || "An error occurred"}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email or username"
                        {...field}
                        data-testid="input-email-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
                data-testid="button-submit"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Instructions"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate("/auth")}
              className="text-sm"
              data-testid="link-back-to-login"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
