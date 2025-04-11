import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertReviewSchema } from "@shared/schema";
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InteractiveRating } from "@/components/ui/rating-stars";
import { Loader2 } from "lucide-react";

// Create a custom validation schema by extending the insert schema
const formSchema = insertReviewSchema
  .omit({ userId: true }) // User ID is added on the server
  .extend({
    rating: z.number().min(1, "Please select a rating").max(5),
    title: z.string().optional(),
    comment: z.string().min(3, "Please enter a comment").max(500, "Comment is too long"),
  });

type FormValues = z.infer<typeof formSchema>;

interface ReviewFormProps {
  productId: number;
  vendorId: number;
  orderId?: number | null;
  onReviewSubmitted?: () => void;
  className?: string;
}

export function ReviewForm({
  productId,
  vendorId,
  orderId = null,
  onReviewSubmitted,
  className,
}: ReviewFormProps) {
  const { submitReviewMutation } = useReviews();
  const isPending = submitReviewMutation.isPending;
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId,
      vendorId,
      orderId,
      rating: 0,
      title: "",
      comment: "",
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    await submitReviewMutation.mutateAsync(values);
    form.reset({
      productId,
      vendorId,
      orderId,
      rating: 0,
      title: "",
      comment: "",
    });
    
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <InteractiveRating
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your experience"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience with this product"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your review helps other shoppers make better decisions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}