"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Plus, Search, Phone, Mail, MapPin, Building, ArrowRight, Loader2 } from "lucide-react";
import { createCustomerAction } from "@/actions/customers";
import { toast } from "sonner";

interface CustomerWithRelations {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string;
  phone: string;
  tags: string | null;
  notes: string | null;
  properties: Array<{
    id: string;
    address: string;
    city: string;
    state: string;
  }>;
  jobs: Array<{
    id: string;
    scheduledDate: Date;
    status: string;
  }>;
}

export function CustomerListClient({
  initialCustomers,
}: {
  initialCustomers: CustomerWithRelations[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Form states
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("TX");
  const [postalCode, setPostalCode] = React.useState("");
  const [gateCode, setGateCode] = React.useState("");
  const [petsKidsWarnings, setPetsKidsWarnings] = React.useState("");

  // Extract unique tags
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    initialCustomers.forEach((c) => {
      if (c.tags) {
        c.tags.split(",").forEach((t) => tagSet.add(t.trim()));
      }
    });
    return Array.from(tagSet);
  }, [initialCustomers]);

  const filteredCustomers = React.useMemo(() => {
    return initialCustomers.filter((customer) => {
      const query = searchTerm.toLowerCase();
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const emailMatches = customer.email.toLowerCase().includes(query);
      const phoneMatches = customer.phone.includes(query);
      const companyMatches = customer.companyName?.toLowerCase().includes(query) ?? false;
      const tagMatches = customer.tags?.toLowerCase().includes(query) ?? false;
      const addressMatches = customer.properties.some((p) =>
        p.address.toLowerCase().includes(query)
      );

      const matchesSearch =
        fullName.includes(query) ||
        emailMatches ||
        phoneMatches ||
        companyMatches ||
        tagMatches ||
        addressMatches;

      if (tagFilter === "ALL") return matchesSearch;
      return matchesSearch && (customer.tags?.includes(tagFilter) ?? false);
    });
  }, [initialCustomers, searchTerm, tagFilter]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("companyName", companyName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("tags", tags);
      formData.append("notes", notes);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("postalCode", postalCode);
      formData.append("gateCode", gateCode);
      formData.append("petsKidsWarnings", petsKidsWarnings);

      const res = await createCustomerAction(formData);

      if (!res.success) {
        toast.error(res.error || "Failed to create customer");
        return;
      }

      toast.success("Customer added successfully!");
      setIsAddModalOpen(false);
      // Reset form
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setEmail("");
      setPhone("");
      setTags("");
      setNotes("");
      setAddress("");
      setCity("");
      setPostalCode("");
      setGateCode("");
      setPetsKidsWarnings("");

      router.refresh();
      if (res.customerId) {
        router.push(`/customers/${res.customerId}`);
      }
    } catch {
      toast.error("An error occurred while creating customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, phone, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="h-11 rounded-lg border border-input bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}

          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground font-medium mb-3">No customers found</p>
          <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Your First Customer
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const primaryProperty = customer.properties[0];

            return (
              <Card
                key={customer.id}
                className="hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      {customer.companyName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                          <Building className="w-3 h-3" /> {customer.companyName}
                        </p>
                      )}
                    </div>
                    {customer.tags && (
                      <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
                        {customer.tags.split(",").slice(0, 2).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <a href={`tel:${customer.phone}`} className="hover:underline">
                        {customer.phone}
                      </a>
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                        {customer.email}
                      </a>
                    </p>
                    {primaryProperty && (
                      <p className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {primaryProperty.address}, {primaryProperty.city}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>

                <div className="px-5 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {customer.properties.length} {customer.properties.length === 1 ? "address" : "addresses"}
                  </span>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline touch-target py-1"
                  >
                    View Account <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
        description="Enter contact info and default service address"
        className="max-w-xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Marcus"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Vance"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company Name (Optional)</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Vance Refrigeration"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 789-0123"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Commercial, Quarterly, High Priority"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Service Address
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Oak Hill Road"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <Input
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <Input
                  placeholder="Zip"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Gate code (e.g. #4921)"
                  value={gateCode}
                  onChange={(e) => setGateCode(e.target.value)}
                />
                <Input
                  placeholder="Pets / Kids warnings"
                  value={petsKidsWarnings}
                  onChange={(e) => setPetsKidsWarnings(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Customer"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

