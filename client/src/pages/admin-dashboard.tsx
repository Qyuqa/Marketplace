import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Vendor } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, Mail, Phone, Store, FileText, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [notes, setNotes] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  // Redirect if user is not an admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user]);

  // Get all vendor applications
  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendor-applications"],
    refetchOnWindowFocus: false,
  });

  // Mutation to approve/reject vendor application
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ vendorId, status, notes }: { vendorId: number; status: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/vendor-applications/${vendorId}`, { status, notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendor-applications"] });
      setOpenDialog(false);
      toast({
        title: "Application Updated",
        description: "The vendor application status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setNotes("");
    setOpenDialog(true);
  };

  const handleReject = (vendor: Vendor) => {
    setActiveVendor(vendor);
    setNotes("");
    setOpenDialog(true);
  };

  const confirmAction = (status: string) => {
    if (!activeVendor) return;
    
    updateApplicationMutation.mutate({
      vendorId: activeVendor.id,
      status,
      notes: notes.trim() ? notes : undefined,
    });
  };

  const pendingApplications = vendors?.filter(v => v.applicationStatus === "pending") || [];
  const approvedApplications = vendors?.filter(v => v.applicationStatus === "approved") || [];
  const rejectedApplications = vendors?.filter(v => v.applicationStatus === "rejected") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">Manage vendor applications and marketplace settings</p>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending Applications 
            {pendingApplications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved Vendors</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Applications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending applications at this time.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingApplications.map((vendor) => (
                <VendorApplicationCard 
                  key={vendor.id} 
                  vendor={vendor} 
                  onApprove={() => handleApprove(vendor)}
                  onReject={() => handleReject(vendor)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="approved">
          {approvedApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No approved vendors yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedApplications.map((vendor) => (
                <VendorApplicationCard 
                  key={vendor.id} 
                  vendor={vendor} 
                  readonly={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {rejectedApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No rejected applications.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedApplications.map((vendor) => (
                <VendorApplicationCard 
                  key={vendor.id} 
                  vendor={vendor} 
                  readonly={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeVendor && (
                <span>Update Application: {activeVendor.storeName}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              Add optional notes about your decision. These notes may be visible to the vendor.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about your decision..."
            className="min-h-[100px]"
          />
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => confirmAction("rejected")}
              disabled={updateApplicationMutation.isPending}
            >
              {updateApplicationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject Application
            </Button>
            <Button
              variant="default"
              onClick={() => confirmAction("approved")}
              disabled={updateApplicationMutation.isPending}
            >
              {updateApplicationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface VendorApplicationCardProps {
  vendor: Vendor;
  readonly?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

function VendorApplicationCard({ vendor, readonly = false, onApprove, onReject }: VendorApplicationCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4 mr-1" />,
    approved: <CheckCircle className="h-4 w-4 mr-1" />,
    rejected: <XCircle className="h-4 w-4 mr-1" />,
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{vendor.storeName}</CardTitle>
            <CardDescription>Submitted by User ID: {vendor.userId}</CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full flex items-center text-sm font-medium ${statusColors[vendor.applicationStatus as keyof typeof statusColors]}`}>
            {statusIcons[vendor.applicationStatus as keyof typeof statusIcons]}
            {vendor.applicationStatus.charAt(0).toUpperCase() + vendor.applicationStatus.slice(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center"><FileText className="h-4 w-4 mr-1" /> Description</h4>
            <p className="text-muted-foreground mt-1">{vendor.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium flex items-center"><Mail className="h-4 w-4 mr-1" /> Contact Email</h4>
              <p className="text-muted-foreground">{vendor.contactEmail}</p>
            </div>
            
            <div>
              <h4 className="font-medium flex items-center"><Phone className="h-4 w-4 mr-1" /> Contact Phone</h4>
              <p className="text-muted-foreground">{vendor.contactPhone || "Not provided"}</p>
            </div>
          </div>
          
          {vendor.applicationNotes && (
            <div>
              <h4 className="font-medium">Admin Notes</h4>
              <p className="text-muted-foreground mt-1">{vendor.applicationNotes}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {!readonly && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onReject}>
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button onClick={onApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}